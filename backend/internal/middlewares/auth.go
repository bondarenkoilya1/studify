package middlewares

import (
	"context"
	"errors"
	"log"
	"net/http"
	"studify/internal/utils"
)

func ValidateAuth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		accessTokenCookie, err := r.Cookie("access_token")
		if err != nil {
			switch {
			case errors.Is(err, http.ErrNoCookie):
				http.Error(w, "unauthorized", http.StatusUnauthorized)
			default:
				log.Println(err)
				http.Error(w, "failed to read cookie", http.StatusInternalServerError)
			}
			return
		}

		userID, err := utils.ParseAccessToken(accessTokenCookie.Value)
		if err != nil {
			http.Error(w, "unauthorized", http.StatusUnauthorized)
			return
		}

		ctx := context.WithValue(r.Context(), "userID", userID)

		next.ServeHTTP(w, r.WithContext(ctx))
	})
}
