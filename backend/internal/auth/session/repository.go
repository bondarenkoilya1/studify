package session

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"studify/internal"
)

func InsertSession(ctx context.Context, db internal.DBTX, s *Session) error {
	query := `
		INSERT INTO sessions (user_id, os, browser, device, country, last_login)
		VALUES ($1, $2, $3, $4, $5, NOW())
		RETURNING id, last_login;
	`

	err := db.QueryRowContext(ctx, query, s.UserID, s.OS, s.Browser, s.Device, s.Country).
		Scan(&s.ID, &s.LastLogin)
	if err != nil {
		return fmt.Errorf("insert session: %w", err)
	}

	return nil
}

func GetSessionByID(ctx context.Context, db internal.DBTX, id int64) (*Session, error) {
	query := `
		SELECT id, user_id, os, browser, device, country, last_login
		FROM sessions
		WHERE id = $1;
	`

	s := &Session{}
	err := db.QueryRowContext(ctx, query, id).Scan(
		&s.ID, &s.UserID, &s.OS, &s.Browser, &s.Device, &s.Country, &s.LastLogin,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrNotFoundSession
		}
		return nil, fmt.Errorf("get session by id: %w", err)
	}

	return s, nil
}

func ListSessionsByUserID(ctx context.Context, db internal.DBTX, userID int64) ([]*Session, error) {
	query := `
		SELECT id, user_id, os, browser, device, country, last_login
		FROM sessions
		WHERE user_id = $1
		ORDER BY last_login DESC;
	`

	rows, err := db.QueryContext(ctx, query, userID)
	if err != nil {
		return nil, fmt.Errorf("list sessions by user id: %w", err)
	}
	defer rows.Close()

	sessions := make([]*Session, 0)
	for rows.Next() {
		s := &Session{}
		if err := rows.Scan(
			&s.ID, &s.UserID, &s.OS, &s.Browser, &s.Device, &s.Country, &s.LastLogin,
		); err != nil {
			return nil, fmt.Errorf("scan session: %w", err)
		}
		sessions = append(sessions, s)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate sessions: %w", err)
	}

	return sessions, nil
}

func UpdateSession(ctx context.Context, db internal.DBTX, s *Session) error {
	query := `
		UPDATE sessions
		SET os = $1, browser = $2, device = $3, country = $4, last_login = NOW()
		WHERE id = $5 AND user_id = $6
		RETURNING last_login;
	`

	err := db.QueryRowContext(ctx, query, s.OS, s.Browser, s.Device, s.Country, s.ID, s.UserID).
		Scan(&s.LastLogin)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return ErrNotFoundSession
		}
		return fmt.Errorf("update session: %w", err)
	}

	return nil
}

func DeleteSession(ctx context.Context, db internal.DBTX, id, userID int64) error {
	query := `
		DELETE FROM sessions
		WHERE id = $1 AND user_id = $2;
	`

	result, err := db.ExecContext(ctx, query, id, userID)
	if err != nil {
		return fmt.Errorf("delete session: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("get deleted session count: %w", err)
	}
	if rowsAffected == 0 {
		return ErrNotFoundSession
	}

	return nil
}

func DeleteSessionsByUserID(ctx context.Context, db internal.DBTX, userID int64) error {
	query := `
		DELETE FROM sessions
		WHERE user_id = $1;
	`

	if _, err := db.ExecContext(ctx, query, userID); err != nil {
		return fmt.Errorf("delete sessions by user id: %w", err)
	}

	return nil
}

func TouchSession(ctx context.Context, db internal.DBTX, s *Session) error {
	query := `
		UPDATE sessions
		SET last_login = NOW()
		WHERE id = $1 AND user_id = $2
		RETURNING last_login;
	`

	err := db.QueryRowContext(ctx, query, s.ID, s.UserID).Scan(&s.LastLogin)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return ErrNotFoundSession
		}
		return fmt.Errorf("touch session: %w", err)
	}

	return nil
}
