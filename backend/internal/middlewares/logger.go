package middlewares

import (
	"log/slog"
	"net/http"
	"studify/internal/util"
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

		if len(correlationID) != 36 || uuid.Validate(correlationID) != nil {
			correlationID = uuid.New().String()
		}

		ctx = slogctx.Prepend(ctx, util.AttrCorrelationID(correlationID))

		r = r.WithContext(ctx)

		w.Header().Set(correlationHeader, correlationID)

		next.ServeHTTP(w, r)
	})
}

func RequestLogger(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()

		rw := &responseWriter{ResponseWriter: w}

		next.ServeHTTP(rw, r)

		status := rw.statusCode
		if status == 0 {
			status = http.StatusOK
		}

		level := slog.LevelInfo
		switch {
		case status >= http.StatusInternalServerError:
			level = slog.LevelError
		case status >= http.StatusBadRequest && status != http.StatusUnauthorized:
			level = slog.LevelWarn
		}

		slog.LogAttrs(
			r.Context(),
			level,
			"request completed",
			util.AttrMethod(r.Method),
			util.AttrPath(r.URL.Path),
			util.AttrStatus(status),
			util.AttrDuration(time.Since(start)),
		)
	})
}
