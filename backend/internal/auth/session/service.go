package session

import (
	"context"
	"database/sql"
	"fmt"
	"studify/internal"
)

type Service struct {
	db *sql.DB
}

func NewService(db *sql.DB) *Service {
	return &Service{db: db}
}

// CreateSession stores a new session for the user (called after a successful login)
// and returns it with the generated ID and last_login filled in.
func (s *Service) CreateSession(ctx context.Context, userID internal.UserID, in Input) (*Session, error) {
	sessions, err := s.listSessions(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("create session for user %d: %w", userID, err)
	}

	for _, existing := range sessions {
		if isSameClient(existing, in) {
			if err := TouchSession(ctx, s.db, existing); err != nil {
				return nil, fmt.Errorf("touch session %d: %w", existing.ID, err)
			}
			return existing, nil
		}
	}

	newSess := &Session{
		UserID:  int64(userID),
		OS:      in.OS,
		Browser: in.Browser,
		Device:  in.Device,
		Country: in.Country,
	}

	if err := InsertSession(ctx, s.db, newSess); err != nil {
		return nil, fmt.Errorf("create session for user %d: %w", userID, err)
	}

	return newSess, nil
}

// getSession returns one session if it belongs to the user.
// Returns ErrNotFoundSession if it doesn't exist or belongs to someone else.
func (s *Service) getSession(ctx context.Context, userID internal.UserID, sessionID int64) (*Session, error) {
	sess, err := GetSessionByID(ctx, s.db, sessionID)
	if err != nil {
		return nil, fmt.Errorf("get session %d: %w", sessionID, err)
	}

	if sess.UserID != int64(userID) {
		return nil, ErrNotFoundSession
	}

	return sess, nil
}

// listSessions returns all active sessions of the user, newest first.
func (s *Service) listSessions(ctx context.Context, userID internal.UserID) ([]*Session, error) {
	sessions, err := ListSessionsByUserID(ctx, s.db, int64(userID))
	if err != nil {
		return nil, fmt.Errorf("list sessions for user %d: %w", userID, err)
	}

	return sessions, nil
}

// updateSession refreshes the client details and last_login of the user's session.
// Returns ErrNotFoundSession if the session doesn't exist or belongs to someone else.
func (s *Service) updateSession(ctx context.Context, userID internal.UserID, sessionID int64, in Input) (*Session, error) {
	sess := &Session{
		ID:      sessionID,
		UserID:  int64(userID),
		OS:      in.OS,
		Browser: in.Browser,
		Device:  in.Device,
		Country: in.Country,
	}

	if err := UpdateSession(ctx, s.db, sess); err != nil {
		return nil, fmt.Errorf("update session %d: %w", sessionID, err)
	}

	return sess, nil
}

// revokeSession deletes one session of the user (log out a single device).
func (s *Service) revokeSession(ctx context.Context, userID internal.UserID, sessionID int64) error {
	if err := DeleteSession(ctx, s.db, sessionID, int64(userID)); err != nil {
		return fmt.Errorf("revoke session %d: %w", sessionID, err)
	}

	return nil
}

// revokeAllSessions deletes every session of the user (log out everywhere).
func (s *Service) revokeAllSessions(ctx context.Context, userID internal.UserID) error {
	if err := DeleteSessionsByUserID(ctx, s.db, int64(userID)); err != nil {
		return fmt.Errorf("revoke all sessions for user %d: %w", userID, err)
	}

	return nil
}

func isSameClient(sess *Session, in Input) bool {
	return sess.OS == in.OS &&
		sess.Browser == in.Browser &&
		sess.Device == in.Device &&
		sess.Country == in.Country
}
