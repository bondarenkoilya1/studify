package middlewares

import (
	"log/slog"
	"net/http"
	"time"

	"github.com/google/uuid"
	slogctx "github.com/veqryn/slog-context"
)

type responseWriter struct {
	http.ResponseWriter
	statusCode int
}

func (w *responseWriter) WriteHeader(code int) {
	w.statusCode = code
	w.ResponseWriter.WriteHeader(code)
}

func (w *responseWriter) Write(body []byte) (int, error) {
	if w.statusCode == 0 {
		w.WriteHeader(http.StatusOK)
	}

	return w.ResponseWriter.Write(body)
}

const correlationHeader = "X-Correlation-ID"

func RequestID(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()

		correlationID := r.Header.Get(correlationHeader)

		if correlationID == "" {
			correlationID = uuid.New().String()
		}

		ctx = slogctx.Prepend(ctx, slog.String("correlation_id", correlationID))

		r = r.WithContext(ctx)

		w.Header().Set(correlationHeader, correlationID)

		next.ServeHTTP(w, r)
	})
}

func RequestLogger(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()

		rw := &responseWriter{ResponseWriter: w}

		next.ServeHTTP(w, r)

		status := rw.statusCode
		if status == 0 {
			status = http.StatusOK
		}

		slog.InfoContext(
			r.Context(),
			"request completed",
			slog.String("method", r.Method),
			slog.String("path", r.URL.Path),
			slog.Int("status", status),
			slog.Duration("duration", time.Since(start)),
		)
	})
}
