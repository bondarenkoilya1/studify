package middlewares

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	chiMiddleware "github.com/go-chi/chi/v5/middleware"
)

func TestAuthLimitSharesEmailQuotaAndResetsIt(t *testing.T) {
	l := NewAuthLimiter()
	now := time.Unix(1000, 0)
	l.now = func() time.Time { return now }
	handler := RequireJSON(l.ByJSONField("login", "email", 2, time.Minute)(http.HandlerFunc(
		func(w http.ResponseWriter, _ *http.Request) { w.WriteHeader(http.StatusNoContent) },
	)))
	for _, tc := range []struct {
		body   string
		status int
		retry  string
	}{
		{`{"email":"Student@Example.com"}`, 204, ""},
		{`{"EMAIL":"student@example.com"}`, 204, ""},
		{`{"email":"student@example.com","EMAIL":null}`, 429, "60"},
		{`{"email":"other@example.com"}`, 204, ""},
	} {
		req := httptest.NewRequest(http.MethodPost, "/", strings.NewReader(tc.body))
		req.Header.Set("Content-Type", "application/json")
		res := httptest.NewRecorder()
		handler.ServeHTTP(res, req)
		if res.Code != tc.status || res.Header().Get("Retry-After") != tc.retry {
			t.Fatalf("%s: got status %d and Retry-After %q", tc.body, res.Code, res.Header().Get("Retry-After"))
		}
	}
	now = now.Add(time.Minute)
	req := httptest.NewRequest(http.MethodPost, "/", strings.NewReader(`{"email":"student@example.com"}`))
	req.Header.Set("Content-Type", "application/json")
	res := httptest.NewRecorder()
	handler.ServeHTTP(res, req)
	if res.Code != http.StatusNoContent {
		t.Fatalf("status after reset = %d", res.Code)
	}
}

func TestAuthIPLimitUsesTCPPeerByDefault(t *testing.T) {
	handler := chiMiddleware.ClientIPFromRemoteAddr(NewAuthLimiter().ByIP("register", 1, time.Minute)(http.HandlerFunc(
		func(w http.ResponseWriter, _ *http.Request) { w.WriteHeader(http.StatusNoContent) },
	)))
	for i, want := range []int{http.StatusNoContent, http.StatusTooManyRequests} {
		req := httptest.NewRequest(http.MethodPost, "/", nil)
		req.RemoteAddr = "192.0.2.1:1234"
		req.Header.Set("X-Forwarded-For", []string{"192.0.2.4", "192.0.2.5"}[i])
		res := httptest.NewRecorder()
		handler.ServeHTTP(res, req)
		if res.Code != want {
			t.Fatalf("request %d: status = %d, want %d", i, res.Code, want)
		}
	}
}
