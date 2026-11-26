package middlewares

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"io"
	"mime"
	"net/http"
	"studify/internal/httpx"
)

const maxJSONBytes = 1 << 20

type jsonBodyKey struct{}

func RequireJSON(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		contentType := r.Header.Get("Content-Type")
		required := "application/json"

		mediaType, _, err := mime.ParseMediaType(contentType)
		if err != nil || mediaType != required {
			httpx.WriteError(w, "Content-Type must be application/json", http.StatusUnsupportedMediaType)
			return
		}

		body := http.MaxBytesReader(w, r.Body, maxJSONBytes)
		defer body.Close()
		data, err := io.ReadAll(body)
		if _, oversized := errors.AsType[*http.MaxBytesError](err); oversized {
			httpx.WriteError(w, "JSON body exceeds 1 MiB", http.StatusRequestEntityTooLarge)
			return
		}
		if err != nil || !json.Valid(data) || !bytes.HasPrefix(bytes.TrimSpace(data), []byte("{")) {
			httpx.WriteCodedError(w, http.StatusBadRequest, "invalid_json", "expected a JSON object")
			return
		}
		r.Body = io.NopCloser(bytes.NewReader(data))
		next.ServeHTTP(w, r.WithContext(context.WithValue(r.Context(), jsonBodyKey{}, data)))
	})
}
