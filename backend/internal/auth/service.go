package auth

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"net/http"
	"studify/internal"
	"studify/internal/auth/credentials"
	"studify/internal/auth/emailconfirm"
	"studify/internal/auth/token"
	"studify/internal/user"
	"studify/internal/util"
	"time"
)

type Service struct {
	db                  *sql.DB
	tokenManager        *token.Manager
	Cookies             *token.Cookies
	emailConfirmService *emailconfirm.Service
}

func NewService(db *sql.DB, tokenManager *token.Manager, cookies *token.Cookies, emailConfirmService *emailconfirm.Service) *Service {
	return &Service{db: db, tokenManager: tokenManager, Cookies: cookies, emailConfirmService: emailConfirmService}
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

//func (s *Service) login(email, password string) error {
//	if err := credentials.ValidateCredentials(email, password, credentials.ActionLogin); err != nil {
//		return err
//	}
//
//	currentUser, err := user.GetUserByEmail(s.db, email)
//	if err != nil {
//		return err
//	}
//
//	if err = bcrypt.CompareHashAndPassword(
//		[]byte(currentUser.PasswordHash),
//		[]byte(password),
//	); err != nil {
//		return err
//	}
//
//	if currentUser.IsTOTPEnabled {
//		challengeToken, err := token.GenerateAuthToken()
//		if err != nil {
//			return err
//		}
//
//		hash := util.HashSHA256(string(challengeToken))
//
//		_, err = challenge.InsertAuthChallenge(
//			s.db,
//			currentUser.ID,
//			[]byte(hash),
//			time.Now().Add(config.ChallengeTokenTTL),
//		)
//		if err != nil {
//			return err
//		}
//
//		response := ChallengeTokenResponse{
//			ChallengeToken: string(challengeToken),
//		}
//
//		//todo!!! mb return _, _, isTotpEnabled := and then other service or actions in the handler
//		//w.Header().Set("Content-Type", "application/json")
//		//
//		//if err := json.NewEncoder(w).Encode(response); err != nil {
//		//	slog.Error("failed to encode response", slog.String("error", err.Error()))
//		//}
//		//
//		//return
//	}
//
//	//todo
//	//if err := s.token.IssueTokens(internal.UserID(currentUser.ID), w); err != nil {
//	//	slog.Error("failed to issue tokens", slog.String("error", err.Error()))
//	//	http.Error(w, "internal server error", http.StatusInternalServerError)
//	//	return
//	//}
//
//	return nil
//}

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
