package user

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"studify/internal"
	"studify/internal/auth/challenge"
	"studify/internal/auth/session"

	"github.com/jackc/pgx/v5/pgconn"
)

const uniqueViolation = "23505" // SQLSTATE для нарушения UNIQUE

func GetUserByEmail(ctx context.Context, db internal.DBTX, email string) (*User, error) {
	query := `
		SELECT id, email, password_hash, is_email_verified, is_totp_enabled, avatar_url
		FROM users
		WHERE id = (
			SELECT CASE WHEN count(*) = 1 THEN min(id)
			            ELSE max(id) FILTER (WHERE email = $1) END
			FROM users WHERE lower(email) = lower($1)
		);
	`

	var user User
	var avatarURL sql.NullString

	err := db.QueryRowContext(ctx, query, email).Scan(
		&user.ID, &user.Email, &user.PasswordHash,
		&user.IsEmailVerified, &user.IsTOTPEnabled, &avatarURL,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrUserNotFound
		}
		return nil, fmt.Errorf("get user by email: %w", err)
	}

	if avatarURL.Valid {
		user.AvatarURL = &avatarURL.String
	}

	return &user, nil
}

func GetUserByID(db *sql.DB, id int64) (*User, error) {
	return GetUserByIDContext(context.Background(), db, id)
}

func GetUserByIDContext(ctx context.Context, db *sql.DB, id int64) (*User, error) {
	return getUserByID(ctx, db, id, false)
}

func GetUserByIDForUpdate(ctx context.Context, tx *sql.Tx, id int64) (*User, error) {
	return getUserByID(ctx, tx, id, true)
}

func getUserByID(ctx context.Context, db internal.DBTX, id int64, lock bool) (*User, error) {
	var user User
	var avatarURL sql.NullString
	fields := "id, email, is_email_verified, is_totp_enabled, avatar_url"
	dest := []any{&user.ID, &user.Email, &user.IsEmailVerified, &user.IsTOTPEnabled, &avatarURL}
	suffix := ""
	if lock {
		fields += ", password_hash"
		dest = append(dest, &user.PasswordHash)
		suffix = " FOR UPDATE"
	}

	query := "SELECT " + fields + " FROM users WHERE id = $1" + suffix
	err := db.QueryRowContext(ctx, query, id).Scan(dest...)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrUserNotFound
		}
		return nil, fmt.Errorf("get user by id: %w", err)
	}

	if avatarURL.Valid {
		user.AvatarURL = &avatarURL.String
	}

	return &user, nil
}

func InsertUser(ctx context.Context, db internal.DBTX, email, passwordHash string) (*User, error) {
	query := `
		INSERT INTO users (email, password_hash)
		VALUES ($1, $2)
		RETURNING id, email, is_email_verified;
	`

	var user User

	err := db.QueryRowContext(ctx, query, email, passwordHash).Scan(&user.ID, &user.Email, &user.IsEmailVerified)
	if err != nil {
		if pgErr, ok := errors.AsType[*pgconn.PgError](err); ok && pgErr.Code == "23505" {
			return nil, ErrUserAlreadyExists
		}
		return nil, fmt.Errorf("insert user: %w", err)
	}

	return &user, nil
}

func VerifyUserEmail(db internal.DBTX, id int64) error {
	query := `UPDATE users SET is_email_verified = TRUE, updated_at = NOW() WHERE id = $1;`

	result, err := db.Exec(query, id)
	if err != nil {
		return fmt.Errorf("verify user email: %w", err)
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("rows affected: %w", err)
	}

	if rows == 0 {
		return ErrUserNotFound
	}

	return nil
}

func updateEmail(ctx context.Context, db internal.DBTX, id int64, newEmail string) (*User, error) {
	query := `
		UPDATE users
		SET email = $1, is_email_verified = FALSE, updated_at = NOW()
		WHERE id = $2
		RETURNING id, email, is_email_verified;
	`

	var user User

	err := db.QueryRowContext(ctx, query, newEmail, id).
		Scan(&user.ID, &user.Email, &user.IsEmailVerified)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrUserNotFound
		}

		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) &&
			pgErr.Code == uniqueViolation &&
			(pgErr.ConstraintName == "users_email_key" || pgErr.ConstraintName == "users_email_normalized_key") {
			return nil, ErrEmailTaken
		}

		return nil, fmt.Errorf("update email (user_id=%d): %w", id, err)
	}

	return &user, nil
}

func invalidateEmailTokens(ctx context.Context, tx *sql.Tx, userID int64) error {
	_, err := tx.ExecContext(ctx, `DELETE FROM auth_tokens
		WHERE user_id = $1 AND type IN ('email_confirmation', 'password_reset')`, userID)
	if err != nil {
		return fmt.Errorf("invalidate email tokens: %w", err)
	}
	return nil
}

// ReplacePasswordAndRevokeSessions requires a transaction holding the user row lock.
func ReplacePasswordAndRevokeSessions(ctx context.Context, tx *sql.Tx, id int64, newPasswordHash string) error {
	query := `UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2;`
	if err := execExpectOne(ctx, tx, query, "update user password", newPasswordHash, id); err != nil {
		return err
	}
	if err := challenge.DeleteAuthChallengesByUserID(ctx, tx, id); err != nil {
		return err
	}
	return session.RevokeUserSessions(ctx, tx, id)
}

// ReplaceUserAvatar sets a new avatar_url and returns the previous value.
// Returns ErrUserNotFound if the user does not exist.
func ReplaceUserAvatar(ctx context.Context, db *sql.DB, id int64, newURL string) (*string, error) {
	const query = `
		UPDATE users u
		SET avatar_url = $2, updated_at = NOW()
		FROM (SELECT id, avatar_url FROM users WHERE id = $1 FOR UPDATE) old
		WHERE u.id = old.id
		RETURNING old.avatar_url;`

	var oldURL sql.NullString
	if err := db.QueryRowContext(ctx, query, id, newURL).Scan(&oldURL); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrUserNotFound
		}
		return nil, fmt.Errorf("replace user avatar: %w", err)
	}

	if !oldURL.Valid {
		return nil, nil
	}
	return &oldURL.String, nil
}

// DeleteUserAvatar sets avatar_url to NULL and returns the previous value.
// Returns ErrUserNotFound if the user does not exist.
func DeleteUserAvatar(ctx context.Context, db *sql.DB, id int64) (*string, error) {
	const query = `
		UPDATE users u
		SET avatar_url = NULL, updated_at = NOW()
		FROM (SELECT id, avatar_url FROM users WHERE id = $1 FOR UPDATE) old
		WHERE u.id = old.id
		RETURNING old.avatar_url;`

	var oldURL sql.NullString
	if err := db.QueryRowContext(ctx, query, id).Scan(&oldURL); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrUserNotFound
		}
		return nil, fmt.Errorf("delete user avatar: %w", err)
	}

	if !oldURL.Valid {
		return nil, nil
	}
	return &oldURL.String, nil
}

// execExpectOne runs an UPDATE and returns ErrUserNotFound if no row was changed.
func execExpectOne(ctx context.Context, db internal.DBTX, query, op string, args ...any) error {
	result, err := db.ExecContext(ctx, query, args...)
	if err != nil {
		return fmt.Errorf("%s: %w", op, err)
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("%s: rows affected: %w", op, err)
	}

	if rows == 0 {
		return ErrUserNotFound
	}

	return nil
}
