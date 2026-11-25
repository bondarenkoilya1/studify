package auth

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"studify/internal"
	"studify/internal/auth/challenge"
	"studify/internal/auth/mfa"
	"studify/internal/auth/rc"
	"studify/internal/auth/session"
	"studify/internal/auth/token"
	"studify/internal/user"
	"studify/internal/util"
	"time"

	"github.com/pquerna/otp/totp"
)

func (s *Service) loginMFA(ctx context.Context, challengeToken, code string, client session.Input) (*user.User, token.Pair, error) {
	if challengeToken == "" {
		return nil, token.Pair{}, ErrRequiredChallengeToken
	}
	if code == "" {
		return nil, token.Pair{}, ErrRequiredMFACode
	}

	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return nil, token.Pair{}, fmt.Errorf("begin MFA login: %w", err)
	}
	defer func() { _ = tx.Rollback() }()

	hash := util.HashSHA256(challengeToken)
	record, err := challenge.GetAuthChallengeByTokenHash(ctx, tx, []byte(hash))
	if err != nil {
		return nil, token.Pair{}, err
	}
	if !record.ExpiresAt.After(time.Now()) {
		return nil, token.Pair{}, ErrChallengeExpired
	}

	currentUser, err := user.GetUserByIDForUpdate(ctx, tx, record.UserID)
	if err != nil {
		return nil, token.Pair{}, err
	}
	if !currentUser.IsTOTPEnabled {
		return nil, token.Pair{}, challenge.ErrChallengeTokenNotFound
	}

	if err := s.verifyLoginCode(ctx, tx, currentUser.ID, code); err != nil {
		return nil, token.Pair{}, err
	}
	if err := challenge.ConsumeAuthChallenge(ctx, tx, record.ID); err != nil {
		return nil, token.Pair{}, err
	}

	pair, err := s.newSession(ctx, tx, internal.UserID(currentUser.ID), client)
	if err != nil {
		return nil, token.Pair{}, fmt.Errorf("create MFA session: %w", err)
	}
	if err := tx.Commit(); err != nil {
		return nil, token.Pair{}, fmt.Errorf("commit MFA login: %w", err)
	}
	return currentUser, pair, nil
}

func (s *Service) verifyLoginCode(ctx context.Context, tx *sql.Tx, userID int64, code string) error {
	if recoveryCode, ok := rc.Normalize(code); ok {
		err := rc.ConsumeRecoveryCode(ctx, tx, userID, util.HashSHA256(recoveryCode))
		if errors.Is(err, sql.ErrNoRows) {
			return ErrInvalidMFACode
		}
		return err
	}

	if len(code) != 6 {
		return ErrInvalidMFACode
	}
	encryptedSecret, err := mfa.GetUserTOTPKeyEncryptedByID(ctx, tx, userID)
	if err != nil {
		return fmt.Errorf("get encrypted TOTP key: %w", err)
	}
	secret, err := mfa.DecryptTOTPKey(encryptedSecret, s.config.TOTPEncryptionKey)
	if err != nil {
		return fmt.Errorf("decrypt TOTP key: %w", err)
	}
	if !totp.Validate(code, secret) {
		return ErrInvalidMFACode
	}
	return nil
}
