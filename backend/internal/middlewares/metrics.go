package middlewares

import (
	"net/http"
	"strconv"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/prometheus/client_golang/prometheus"
)

type statusRecorder struct {
	http.ResponseWriter
	status      int
	wroteHeader bool
}

func Metrics(requestsTotal *prometheus.CounterVec, requestDuration *prometheus.HistogramVec) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			start := time.Now()

			ww := &statusRecorder{ResponseWriter: w, status: http.StatusOK}

			next.ServeHTTP(ww, r)

			route := chi.RouteContext(r.Context()).RoutePattern()
			if route == "" {
				route = "unknown"
			}

			duration := time.Since(start).Seconds()
			status := strconv.Itoa(ww.status)

			requestsTotal.WithLabelValues(r.Method, route, status).Inc()
			requestDuration.WithLabelValues(r.Method, route).Observe(duration)
		})
	}
}

func (r *statusRecorder) WriteHeader(code int) {
	if r.wroteHeader {
		return
	}

	r.wroteHeader = true
	r.status = code
	r.ResponseWriter.WriteHeader(code)
}
