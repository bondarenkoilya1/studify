package middlewares

import (
	"context"
	"errors"
	"log/slog"
	"net/http"
	"studify/internal/auth/token"
	"studify/internal/httpx"
)

func ValidateAuth(token *token.Service) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			accessTokenCookie, err := r.Cookie("access_token")
			if err != nil {
				switch {
				case errors.Is(err, http.ErrNoCookie):
					http.Error(w, "unauthorized", http.StatusUnauthorized)
				default:
					slog.Error("failed to read cookie", slog.String("error", err.Error()))
					http.Error(w, "failed to read cookie", http.StatusInternalServerError)
				}
				return
			}

			userID, err := token.ParseAccessToken(accessTokenCookie.Value)
			if err != nil {
				http.Error(w, "unauthorized", http.StatusUnauthorized)
				return
			}

			ctx := context.WithValue(r.Context(), httpx.UserIDKey, userID)

			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}
