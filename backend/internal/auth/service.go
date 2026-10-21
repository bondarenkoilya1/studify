package auth

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"net/http"
	"studify/internal"
	"studify/internal/auth/challenge"
	"studify/internal/auth/credentials"
	"studify/internal/auth/emailconfirm"
	"studify/internal/auth/mfa"
	"studify/internal/auth/token"
	"studify/internal/config"
	"studify/internal/user"
	"studify/internal/util"
	"time"

	"github.com/pquerna/otp/totp"
	"golang.org/x/crypto/bcrypt"
)

type Service struct {
	db                  *sql.DB
	tokenManager        *token.Manager
	Cookies             *token.Cookies
	emailConfirmService *emailconfirm.Service
	config              *config.Config
}

func NewService(
	db *sql.DB,
	tokenManager *token.Manager,
	cookies *token.Cookies,
	emailConfirmService *emailconfirm.Service,
	config *config.Config,
) *Service {
	return &Service{
		db:                  db,
		tokenManager:        tokenManager,
		Cookies:             cookies,
		emailConfirmService: emailConfirmService,
		config:              config,
	}
}

func (s *Service) register(ctx context.Context, email, password string) (*user.User, token.Pair, error) {
	if err := credentials.ValidateCredentials(email, password, credentials.ActionRegister); err != nil {
		return nil, token.Pair{}, err
	}

	passwordHash, err := credentials.HashPassword(password)
	if err != nil {
		return nil, token.Pair{}, fmt.Errorf("hash password: %w", err)
	}

	newUser, err := user.InsertUser(s.db, email, passwordHash)
	if err != nil {
		return nil, token.Pair{}, fmt.Errorf("insert user: %w", err)
	}

	pair, err := s.newSession(ctx, s.db, internal.UserID(newUser.ID))
	if err != nil {
		return nil, token.Pair{}, fmt.Errorf("create new session: %w", err)
	}

	if err := s.emailConfirmService.SendConfirmationEmail(ctx, internal.UserID(newUser.ID), newUser.Email); err != nil {
		return nil, token.Pair{}, fmt.Errorf("send confirmation email: %w", err)
	}

	return newUser, pair, nil
}

func (s *Service) login(ctx context.Context, email, password string) (*loginResponse, error) {
	// Validate
	if err := credentials.ValidateCredentials(email, password, credentials.ActionLogin); err != nil {
		return nil, err
	}

	currentUser, err := user.GetUserByEmail(s.db, email)
	if err != nil {
		return nil, err
	}

	if err = bcrypt.CompareHashAndPassword(
		[]byte(currentUser.PasswordHash),
		[]byte(password),
	); err != nil {
		return nil, err
	}

	// Check on TOTP
	var challengeToken token.Token

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
			time.Now().Add(config.ChallengeTokenTTL),
		)
		if err != nil {
			return nil, err
		}
	}

	// Data for login
	pair, err := s.newSession(ctx, s.db, internal.UserID(currentUser.ID))
	if err != nil {
		return nil, fmt.Errorf("create session: %w", err)
	}

	response := &loginResponse{
		User:           currentUser,
		Pair:           pair,
		IsTOTPRequired: currentUser.IsTOTPEnabled,
		ChallengeToken: challengeToken,
	}

	return response, nil
}

func (s *Service) loginTOTP(ctx context.Context, challengeToken, code string) (*user.User, token.Pair, error) {
	if challengeToken == "" {
		return nil, token.Pair{}, fmt.Errorf("challenge token is required")
	}

	if code == "" {
		return nil, token.Pair{}, fmt.Errorf("TOTP code is required")
	}

	challengeTokenHash := util.HashSHA256(challengeToken)

	record, err := challenge.GetAuthChallengeByTokenHash(s.db, []byte(challengeTokenHash))
	if err != nil {
		return nil, token.Pair{}, fmt.Errorf("get auth challenge: %w", err)
	}

	if time.Now().After(record.ExpiresAt) {
		return nil, token.Pair{}, fmt.Errorf("challenge token expired")
	}

	currentUser, err := user.GetUserByID(s.db, record.UserID)
	if err != nil {
		return nil, token.Pair{}, fmt.Errorf("get user: %w", err)
	}

	encryptedSecret, err := mfa.GetUserTOTPKeyEncryptedByID(ctx, s.db, currentUser.ID)
	if err != nil {
		return nil, token.Pair{}, fmt.Errorf("get encrypted TOTP key: %w", err)
	}

	decryptedSecret, err := mfa.DecryptTOTPKey(encryptedSecret, s.config.TOTPEncryptionKey)
	if err != nil {
		return nil, token.Pair{}, fmt.Errorf("decrypt TOTP key: %w", err)
	}

	if !totp.Validate(code, decryptedSecret) {
		return nil, token.Pair{}, fmt.Errorf("invalid TOTP code")
	}

	if err := challenge.DeleteAuthChallenge(s.db, record.ID); err != nil {
		return nil, token.Pair{}, fmt.Errorf("delete auth challenge: %w", err)
	}

	pair, err := s.newSession(ctx, s.db, internal.UserID(currentUser.ID))
	if err != nil {
		return nil, token.Pair{}, fmt.Errorf("create session: %w", err)
	}

	return currentUser, pair, nil
}

func (s *Service) logout(ctx context.Context, refreshToken token.RefreshToken) error {
	_, refreshTokenID, err := s.tokenManager.ParseRefresh(refreshToken)
	if err != nil {
		return fmt.Errorf("%w: %v", ErrInvalidToken, err)
	}

	if err = token.RevokeRefreshToken(ctx, s.db, string(refreshTokenID)); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return ErrTokenNotFound
		}
		return fmt.Errorf("revoke refresh token: %w", err)
	}

	return nil
}

func (s *Service) newSession(ctx context.Context, q internal.DBTX, userID internal.UserID) (token.Pair, error) {
	refresh, id, err := s.tokenManager.NewRefresh(userID)
	if err != nil {
		return token.Pair{}, fmt.Errorf("new refresh: %w", err)
	}

	expiresAt := time.Now().Add(s.tokenManager.RefreshTTL())

	_, err = token.InsertRefreshToken(ctx, q, int64(userID), string(id), util.HashSHA256(string(refresh)), expiresAt)
	if err != nil {
		return token.Pair{}, fmt.Errorf("insert refresh token: %w", err)
	}

	access, err := s.tokenManager.NewAccess(userID)
	if err != nil {
		return token.Pair{}, fmt.Errorf("new access: %w", err)
	}

	return token.Pair{Access: access, Refresh: refresh}, nil
}

func (s *Service) rejectRefresh(w http.ResponseWriter) {
	s.Cookies.Clear(w)
	http.Error(w, "unauthorized", http.StatusUnauthorized)
}
