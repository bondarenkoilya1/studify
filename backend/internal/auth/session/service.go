package session

import (
	"context"
	"database/sql"
	"fmt"
	"studify/internal/auth/token"
)

type Service struct {
	db *sql.DB
}

func NewService(db *sql.DB) *Service {
	return &Service{db: db}
}

// BeginForUser serializes session creation, rotation and revocation for one account.
func BeginForUser(ctx context.Context, db *sql.DB, userID int64) (*sql.Tx, error) {
	tx, err := db.BeginTx(ctx, nil)
	if err != nil {
		return nil, fmt.Errorf("begin session transaction: %w", err)
	}

	var id int64
	if err := tx.QueryRowContext(ctx, `SELECT id FROM users WHERE id = $1 FOR UPDATE`, userID).Scan(&id); err != nil {
		_ = tx.Rollback()
		return nil, fmt.Errorf("lock session owner: %w", err)
	}
	return tx, nil
}

func (s *Service) IsActive(ctx context.Context, userID, sessionID int64) (bool, error) {
	var active bool
	err := s.db.QueryRowContext(ctx, `
		SELECT EXISTS (SELECT 1 FROM sessions WHERE id = $1 AND user_id = $2)
	`, sessionID, userID).Scan(&active)
	return active, err
}

func (s *Service) GetSession(ctx context.Context, userID, sessionID int64) (*Session, error) {
	return GetSessionByID(ctx, s.db, sessionID, userID)
}

func (s *Service) ListSessions(ctx context.Context, userID int64) ([]*Session, error) {
	return ListSessionsByUserID(ctx, s.db, userID)
}

func (s *Service) RevokeSession(ctx context.Context, userID, sessionID int64) error {
	tx, err := BeginForUser(ctx, s.db, userID)
	if err != nil {
		return err
	}
	defer func() { _ = tx.Rollback() }()

	if err := DeleteSession(ctx, tx, sessionID, userID); err != nil {
		return err
	}
	return tx.Commit()
}

func (s *Service) RevokeAllSessions(ctx context.Context, userID int64) error {
	tx, err := BeginForUser(ctx, s.db, userID)
	if err != nil {
		return err
	}
	defer func() { _ = tx.Rollback() }()

	if err := RevokeUserSessions(ctx, tx, userID); err != nil {
		return err
	}
	return tx.Commit()
}

// RevokeUserSessions runs inside a transaction that already holds the user row lock.
func RevokeUserSessions(ctx context.Context, tx *sql.Tx, userID int64) error {
	if err := DeleteSessionsByUserID(ctx, tx, userID); err != nil {
		return err
	}
	// Existing refresh tokens can be unlinked until their first rotation.
	return token.RevokeAllRefreshTokens(ctx, tx, userID)
}
