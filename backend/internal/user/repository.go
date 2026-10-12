package user

import (
	"database/sql"
	"errors"
	"fmt"

	"github.com/jackc/pgx/v5/pgconn"
)

var (
	ErrUserAlreadyExists = errors.New("user already exists")
	ErrUserNotFound      = errors.New("user not found")
)

func GetUserByEmail(db *sql.DB, email string) (*User, error) {
	query := `
		SELECT id, email, password_hash, is_email_verified, is_totp_enabled, avatar_url
		FROM users
		WHERE email = $1;
	`

	var user User
	var avatarURL sql.NullString

	err := db.QueryRow(query, email).Scan(
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
	query := `
		SELECT id, email, is_email_verified, is_totp_enabled, avatar_url
		FROM users
		WHERE id = $1;
	`

	var user User
	var avatarURL sql.NullString

	err := db.QueryRow(query, id).Scan(
		&user.ID, &user.Email, &user.IsEmailVerified, &user.IsTOTPEnabled, &avatarURL,
	)
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

func GetUserPasswordHashByID(db *sql.DB, id int64) (string, error) {
	query := `SELECT password_hash FROM users WHERE id = $1;`

	var passwordHash string

	if err := db.QueryRow(query, id).Scan(&passwordHash); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return "", ErrUserNotFound
		}
		return "", fmt.Errorf("get user password hash by id: %w", err)
	}

	return passwordHash, nil
}

func InsertUser(db *sql.DB, email, passwordHash string) (*User, error) {
	query := `
		INSERT INTO users (email, password_hash)
		VALUES ($1, $2)
		RETURNING id, email, is_email_verified;
	`

	var user User

	err := db.QueryRow(query, email, passwordHash).Scan(&user.ID, &user.Email, &user.IsEmailVerified)
	if err != nil {
		if pgErr, ok := errors.AsType[*pgconn.PgError](err); ok && pgErr.Code == "23505" {
			return nil, ErrUserAlreadyExists
		}
		return nil, fmt.Errorf("insert user: %w", err)
	}

	return &user, nil
}

func VerifyUserEmail(db *sql.DB, id int64) error {
	query := `UPDATE users SET is_email_verified = TRUE WHERE id = $1;`

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

func UpdateUserEmail(db *sql.DB, id int64, newEmail string) (*User, error) {
	query := `
		UPDATE users
		SET email = $1, is_email_verified = FALSE
		WHERE id = $2
		RETURNING id, email, is_email_verified;
	`

	var user User

	err := db.QueryRow(query, newEmail, id).Scan(&user.ID, &user.Email, &user.IsEmailVerified)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrUserNotFound
		}
		return nil, fmt.Errorf("update user email: %w", err)
	}

	return &user, nil
}

func UpdateUserPassword(db *sql.DB, id int64, newPasswordHash string) error {
	query := `UPDATE users SET password_hash = $1 WHERE id = $2;`

	return execExpectOne(db, query, "update user password", newPasswordHash, id)
}

// ReplaceUserAvatar sets a new avatar_url and returns the previous value.
// Returns ErrUserNotFound if the user does not exist.
func ReplaceUserAvatar(db *sql.DB, id int64, newURL string) (*string, error) {
	const query = `
		UPDATE users u
		SET avatar_url = $2
		FROM (SELECT id, avatar_url FROM users WHERE id = $1 FOR UPDATE) old
		WHERE u.id = old.id
		RETURNING old.avatar_url;`

	var oldURL sql.NullString
	if err := db.QueryRow(query, id, newURL).Scan(&oldURL); err != nil {
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
func DeleteUserAvatar(db *sql.DB, id int64) (*string, error) {
	const query = `
		UPDATE users u
		SET avatar_url = NULL
		FROM (SELECT id, avatar_url FROM users WHERE id = $1 FOR UPDATE) old
		WHERE u.id = old.id
		RETURNING old.avatar_url;`

	var oldURL sql.NullString
	if err := db.QueryRow(query, id).Scan(&oldURL); err != nil {
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
func execExpectOne(db *sql.DB, query, op string, args ...any) error {
	result, err := db.Exec(query, args...)
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
