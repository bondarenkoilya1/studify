package middlewares

import (
	"context"
	"errors"
	"log/slog"
	"net/http"
	"studify/internal/auth/session"
	"studify/internal/auth/token"
	"studify/internal/httpx"
	"studify/internal/util"
)

func ValidateAuth(tokenManager *token.Manager, sessions *session.Service) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			accessTokenCookie, err := r.Cookie("access_token")
			if err != nil {
				switch {
				case errors.Is(err, http.ErrNoCookie):
					httpx.WriteCodedError(w, http.StatusUnauthorized, "session_required", "unauthorized")
				default:
					slog.ErrorContext(r.Context(), "failed to read cookie",
						util.AttrError(err),
					)
					httpx.WriteError(w, "failed to read cookie", http.StatusInternalServerError)
				}
				return
			}

			userID, sessionID, err := tokenManager.ParseAccess(token.AccessToken(accessTokenCookie.Value))
			if err != nil {
				httpx.WriteCodedError(w, http.StatusUnauthorized, "session_required", "unauthorized")
				return
			}

			active, err := sessions.IsActive(r.Context(), int64(userID), sessionID)
			if err != nil {
				slog.ErrorContext(r.Context(), "failed to check session", util.AttrError(err))
				httpx.WriteError(w, "internal server error", http.StatusInternalServerError)
				return
			}
			if !active {
				httpx.WriteCodedError(w, http.StatusUnauthorized, "session_required", "unauthorized")
				return
			}

			ctx := context.WithValue(r.Context(), httpx.UserIDKey, userID)
			ctx = context.WithValue(ctx, httpx.SessionIDKey, sessionID)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}
