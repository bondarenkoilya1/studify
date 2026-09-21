package middlewares

import (
	"log/slog"
	"net/http"

	"github.com/google/uuid"
	slogctx "github.com/veqryn/slog-context"
)

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
		slog.InfoContext(
			r.Context(),
			"incoming request",
			slog.String("method", r.Method),
			slog.String("path", r.URL.Path),
			slog.String("referrr", r.Referer()),
		)

		next.ServeHTTP(w, r)
	})
}
