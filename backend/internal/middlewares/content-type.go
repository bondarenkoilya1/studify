package middlewares

import (
	"bytes"
	"encoding/json"
	"errors"
	"io"
	"mime"
	"net/http"
)

const maxJSONBytes = 1 << 20

func RequireJSON(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		contentType := r.Header.Get("Content-Type")
		required := "application/json"

		mediaType, _, err := mime.ParseMediaType(contentType)
		if err != nil || mediaType != required {
			http.Error(w, "Content-Type must be application/json", http.StatusUnsupportedMediaType)
			return
		}

		body := http.MaxBytesReader(w, r.Body, maxJSONBytes)
		defer body.Close()
		data, err := io.ReadAll(body)
		if _, oversized := errors.AsType[*http.MaxBytesError](err); oversized {
			http.Error(w, "JSON body exceeds 1 MiB", http.StatusRequestEntityTooLarge)
			return
		}
		if err != nil || !json.Valid(data) {
			http.Error(w, "invalid JSON", http.StatusBadRequest)
			return
		}
		r.Body = io.NopCloser(bytes.NewReader(data))
		next.ServeHTTP(w, r)
	})
}
