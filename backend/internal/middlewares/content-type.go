package middlewares

import (
	"mime"
	"net/http"
)

func RequireJSON(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		contentType := r.Header.Get("Content-Type")
		required := "application/json"

		mediaType, _, err := mime.ParseMediaType(contentType)
		if err != nil || mediaType != required {
			http.Error(w, "Content-Type must be application/json", http.StatusUnsupportedMediaType)
			return
		}

		next.ServeHTTP(w, r)
	})
}
