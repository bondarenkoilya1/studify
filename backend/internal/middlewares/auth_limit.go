package middlewares

import (
	"crypto/sha256"
	"encoding/json"
	"net/http"
	"net/netip"
	"strconv"
	"strings"
	"sync"
	"time"

	"studify/internal/httpx"

	chiMiddleware "github.com/go-chi/chi/v5/middleware"
)

type limitWindow struct {
	expiresAt time.Time
	used      int
}

type authLimitKey struct {
	scope string
	kind  string
	value [sha256.Size]byte
}

type AuthLimiter struct {
	mu        sync.Mutex
	windows   map[authLimitKey]limitWindow
	nextSweep time.Time
	now       func() time.Time
}

func NewAuthLimiter() *AuthLimiter {
	return &AuthLimiter{
		windows: make(map[authLimitKey]limitWindow),
		now:     time.Now,
	}
}

func (l *AuthLimiter) ByIP(scope string, limit int, period time.Duration) func(http.Handler) http.Handler {
	return l.middleware(scope, "ip", limit, period, func(r *http.Request) string {
		ip := chiMiddleware.GetClientIPAddr(r.Context())
		if !ip.IsValid() {
			return "unknown"
		}
		if ip.Is6() {
			return netip.PrefixFrom(ip, 64).Masked().String()
		}
		return ip.String()
	})
}

// ByJSONField requires RequireJSON earlier in the route middleware chain.
func (l *AuthLimiter) ByJSONField(scope, field string, limit int, period time.Duration) func(http.Handler) http.Handler {
	return l.middleware(scope, field, limit, period, func(r *http.Request) string {
		data, _ := r.Context().Value(jsonBodyKey{}).([]byte)
		switch field {
		case "email":
			var body struct {
				Email string `json:"email"`
			}
			if json.Unmarshal(data, &body) == nil {
				return strings.ToLower(strings.TrimSpace(body.Email))
			}
		case "challenge_token":
			var body struct {
				ChallengeToken string `json:"challenge_token"`
			}
			if json.Unmarshal(data, &body) == nil {
				return body.ChallengeToken
			}
		}
		return ""
	})
}

func (l *AuthLimiter) ByAccount(scope string, limit int, period time.Duration) func(http.Handler) http.Handler {
	return l.middleware(scope, "account", limit, period, func(r *http.Request) string {
		id, err := httpx.GetUserID(r)
		if err != nil {
			return ""
		}
		return strconv.FormatInt(id, 10)
	})
}

func (l *AuthLimiter) middleware(
	scope, kind string,
	limit int,
	period time.Duration,
	identity func(*http.Request) string,
) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			value := identity(r)
			if value != "" {
				key := authLimitKey{scope: scope, kind: kind, value: sha256.Sum256([]byte(value))}
				if retry := l.retryAfter(key, limit, period); retry > 0 {
					seconds := (retry + time.Second - 1) / time.Second
					w.Header().Set("Retry-After", strconv.FormatInt(int64(seconds), 10))
					http.Error(w, "too many requests", http.StatusTooManyRequests)
					return
				}
			}
			next.ServeHTTP(w, r)
		})
	}
}

func (l *AuthLimiter) retryAfter(key authLimitKey, limit int, period time.Duration) time.Duration {
	l.mu.Lock()
	defer l.mu.Unlock()

	now := l.now()
	if !now.Before(l.nextSweep) {
		for key, window := range l.windows {
			if !now.Before(window.expiresAt) {
				delete(l.windows, key)
			}
		}
		l.nextSweep = now.Add(time.Minute)
	}

	window, exists := l.windows[key]
	if !exists {
		const maxKeys = 32768
		if len(l.windows) >= maxKeys {
			return l.nextSweep.Sub(now)
		}
	}
	if !now.Before(window.expiresAt) {
		window = limitWindow{expiresAt: now.Add(period)}
	}
	if window.used >= limit {
		return window.expiresAt.Sub(now)
	}
	window.used++
	l.windows[key] = window
	return 0
}
