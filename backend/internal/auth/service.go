package auth

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"studify/internal"
	"studify/internal/auth/challenge"
	"studify/internal/auth/credentials"
	"studify/internal/auth/emailconfirm"
	"studify/internal/auth/session"
	"studify/internal/auth/token"
	"studify/internal/config"
	"studify/internal/user"
	"studify/internal/util"
	"time"

	"golang.org/x/crypto/bcrypt"
)

type Service struct {
	db                  *sql.DB
	tokenManager        *token.Manager
	Cookies             *token.Cookies
	emailConfirmService *emailconfirm.Service
	sessions            *session.Service
	config              *config.Config
}

func NewService(
	db *sql.DB,
	tokenManager *token.Manager,
	cookies *token.Cookies,
	emailConfirmService *emailconfirm.Service,
	sessions *session.Service,
	config *config.Config,
) *Service {
	return &Service{
		db:                  db,
		tokenManager:        tokenManager,
		Cookies:             cookies,
		emailConfirmService: emailConfirmService,
		sessions:            sessions,
		config:              config,
	}
}

// Handlers

func (s *Service) register(ctx context.Context, email, password string, client session.Input) (*user.User, token.Pair, error) {
	if err := credentials.ValidateCredentials(email, password, credentials.ActionRegister); err != nil {
		return nil, token.Pair{}, ErrInvalidRegistration
	}

	passwordHash, err := credentials.HashPassword(password)
	if err != nil {
		if errors.Is(err, bcrypt.ErrPasswordTooLong) {
			return nil, token.Pair{}, ErrInvalidRegistration
		}
		return nil, token.Pair{}, fmt.Errorf("hash password: %w", err)
	}

	newUser, err := user.InsertUser(s.db, email, passwordHash)
	if err != nil {
		return nil, token.Pair{}, fmt.Errorf("insert user: %w", err)
	}

	pair, err := s.startSession(ctx, internal.UserID(newUser.ID), client)
	if err != nil {
		return nil, token.Pair{}, fmt.Errorf("create new session: %w", err)
	}

	if err := s.emailConfirmService.SendConfirmationEmail(ctx, internal.UserID(newUser.ID), newUser.Email); err != nil {
		return nil, token.Pair{}, fmt.Errorf("send confirmation email: %w", err)
	}

	return newUser, pair, nil
}

func (s *Service) login(ctx context.Context, email, password string, client session.Input) (*loginResponse, error) {
	// Validate
	if err := credentials.ValidateCredentials(email, password, credentials.ActionLogin); err != nil {
		return nil, ErrInvalidCredentials
	}

	currentUser, err := user.GetUserByEmail(s.db, email)
	if err != nil {
		return nil, err
	}

	if err = bcrypt.CompareHashAndPassword(
		[]byte(currentUser.PasswordHash),
		[]byte(password),
	); err != nil {
		if errors.Is(err, bcrypt.ErrMismatchedHashAndPassword) {
			return nil, ErrInvalidCredentials
		}
		return nil, fmt.Errorf("check password: %w", err)
	}

	// Check on TOTP
	var (
		pair           token.Pair
		challengeToken token.Token
	)

	if currentUser.IsTOTPEnabled {
		challengeToken, err = token.GenerateAuthToken()
		if err != nil {
			return nil, err
		}

		hash := util.HashSHA256(string(challengeToken))

		_, err = challenge.InsertAuthChallenge(
			s.db,
			currentUser.ID,
			[]byte(hash),
			time.Now().UTC().Add(config.ChallengeTokenTTL),
		)
		if err != nil {
			return nil, err
		}
	} else {
		pair, err = s.startSession(ctx, internal.UserID(currentUser.ID), client)
		if err != nil {
			return nil, fmt.Errorf("create session: %w", err)
		}
	}

	response := &loginResponse{
		User:           currentUser,
		Pair:           pair,
		IsTOTPRequired: currentUser.IsTOTPEnabled,
		ChallengeToken: challengeToken,
	}

	return response, nil
}

func (s *Service) logout(ctx context.Context, refreshToken token.RefreshToken) error {
	userID, tokenID, err := s.tokenManager.ParseRefresh(refreshToken)
	if err != nil {
		return ErrInvalidToken
	}

	tx, err := session.BeginForUser(ctx, s.db, int64(userID))
	if errors.Is(err, sql.ErrNoRows) {
		return ErrTokenNotFound
	}
	if err != nil {
		return err
	}
	defer func() { _ = tx.Rollback() }()

	record, err := storedRefreshToken(ctx, tx, refreshToken, userID, tokenID)
	if err != nil {
		return err
	}
	if record.SessionID.Valid {
		if err := session.DeleteSession(ctx, tx, record.SessionID.Int64, int64(userID)); err != nil {
			return err
		}
	} else if record.RevokedAt == nil {
		if err := token.RevokeRefreshToken(ctx, tx, string(tokenID)); err != nil {
			return err
		}
	}
	return tx.Commit()
}

func (s *Service) refreshTokens(ctx context.Context, refreshToken token.RefreshToken, client session.Input) (token.Pair, error) {
	userID, tokenID, err := s.tokenManager.ParseRefresh(refreshToken)
	if err != nil {
		return token.Pair{}, ErrInvalidToken
	}
	tx, err := session.BeginForUser(ctx, s.db, int64(userID))
	if errors.Is(err, sql.ErrNoRows) {
		return token.Pair{}, ErrTokenNotFound
	}
	if err != nil {
		return token.Pair{}, err
	}
	defer func() { _ = tx.Rollback() }()

	record, err := storedRefreshToken(ctx, tx, refreshToken, userID, tokenID)
	if err != nil {
		return token.Pair{}, err
	}
	if record.ReplacedByTokenID != nil && record.SessionID.Valid {
		return token.Pair{}, errRefreshReplaced
	}
	if record.RevokedAt != nil || !record.ExpiresAt.After(time.Now()) {
		return token.Pair{}, ErrInvalidToken
	}

	sessionID := record.SessionID.Int64
	if !record.SessionID.Valid {
		sessionID, err = insertSession(ctx, tx, userID, client)
	} else {
		err = session.TouchSession(ctx, tx, sessionID, int64(userID))
	}
	if err != nil {
		return token.Pair{}, err
	}

	pair, replacementID, err := s.issueTokens(ctx, tx, userID, sessionID)
	if err != nil {
		return token.Pair{}, err
	}
	if err := token.ReplaceRefreshToken(ctx, tx, string(tokenID), string(replacementID), sessionID); err != nil {
		return token.Pair{}, err
	}
	if err := tx.Commit(); err != nil {
		return token.Pair{}, fmt.Errorf("commit refresh transaction: %w", err)
	}
	return pair, nil
}

func storedRefreshToken(ctx context.Context, q internal.DBTX, raw token.RefreshToken, userID internal.UserID, id token.TokenID) (*token.RefreshTokenRecord, error) {
	record, err := token.GetRefreshTokenByTokenID(ctx, q, string(id), true)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, ErrTokenNotFound
	}
	if err != nil {
		return nil, err
	}
	if record.UserID != int64(userID) || !util.CompareHashSHA256(string(raw), record.TokenHash) {
		return nil, ErrInvalidToken
	}
	return record, nil
}

func (s *Service) startSession(ctx context.Context, userID internal.UserID, client session.Input) (token.Pair, error) {
	tx, err := session.BeginForUser(ctx, s.db, int64(userID))
	if err != nil {
		return token.Pair{}, err
	}
	defer func() { _ = tx.Rollback() }()

	pair, err := s.newSession(ctx, tx, userID, client)
	if err != nil {
		return token.Pair{}, err
	}
	if err := tx.Commit(); err != nil {
		return token.Pair{}, fmt.Errorf("commit new session: %w", err)
	}
	return pair, nil
}

func (s *Service) newSession(ctx context.Context, q internal.DBTX, userID internal.UserID, client session.Input) (token.Pair, error) {
	id, err := insertSession(ctx, q, userID, client)
	if err != nil {
		return token.Pair{}, err
	}
	pair, _, err := s.issueTokens(ctx, q, userID, id)
	return pair, err
}

func insertSession(ctx context.Context, q internal.DBTX, userID internal.UserID, client session.Input) (int64, error) {
	sess := session.Session{
		UserID: int64(userID), OS: client.OS, Browser: client.Browser,
		Device: client.Device, Country: client.Country,
	}
	if err := session.InsertSession(ctx, q, &sess); err != nil {
		return 0, err
	}
	return sess.ID, nil
}

func (s *Service) issueTokens(ctx context.Context, q internal.DBTX, userID internal.UserID, sessionID int64) (token.Pair, token.TokenID, error) {
	refresh, id, err := s.tokenManager.NewRefresh(userID)
	if err != nil {
		return token.Pair{}, "", fmt.Errorf("new refresh: %w", err)
	}

	expiresAt := time.Now().Add(s.tokenManager.RefreshTTL())
	_, err = token.InsertRefreshToken(ctx, q, int64(userID), sessionID, string(id), util.HashSHA256(string(refresh)), expiresAt)
	if err != nil {
		return token.Pair{}, "", fmt.Errorf("insert refresh token: %w", err)
	}

	access, err := s.tokenManager.NewAccess(userID, sessionID)
	if err != nil {
		return token.Pair{}, "", fmt.Errorf("new access: %w", err)
	}
	return token.Pair{Access: access, Refresh: refresh}, id, nil
}
