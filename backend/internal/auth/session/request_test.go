package session

import (
	"net/http/httptest"
	"testing"
)

func TestInputFromRequest(t *testing.T) {
	r := httptest.NewRequest("POST", "/api/auth/login", nil)
	r.RemoteAddr = "[::1]:1234"
	r.Header.Set("User-Agent", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36")

	input := InputFromRequest(r)
	if input.Country != "::1" || input.Browser != "Chrome" {
		t.Fatalf("unexpected client details: %+v", input)
	}
}
