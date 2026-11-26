package middlewares

import (
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestRequireJSONBodyLimit(t *testing.T) {
	for _, tt := range []struct {
		name     string
		body     string
		chunked  bool
		wantCode int
	}{
		{"max size", "{}" + strings.Repeat(" ", maxJSONBytes-2), false, http.StatusNoContent},
		{"over known length", "{}" + strings.Repeat(" ", maxJSONBytes), false, http.StatusRequestEntityTooLarge},
		{"over streamed length", "{}" + strings.Repeat(" ", maxJSONBytes), true, http.StatusRequestEntityTooLarge},
		{"multiple values", "{} {}", true, http.StatusBadRequest},
	} {
		t.Run(tt.name, func(t *testing.T) {
			request := httptest.NewRequest(http.MethodPost, "/", strings.NewReader(tt.body))
			request.Header.Set("Content-Type", "application/json")
			if tt.chunked {
				request.ContentLength = -1
			}
			recorder := httptest.NewRecorder()
			RequireJSON(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				data, err := io.ReadAll(r.Body)
				if err != nil || string(data) != tt.body {
					t.Fatalf("handler body length or contents changed: %v", err)
				}
				w.WriteHeader(http.StatusNoContent)
			})).ServeHTTP(recorder, request)
			if recorder.Code != tt.wantCode {
				t.Fatalf("status = %d, want %d", recorder.Code, tt.wantCode)
			}
		})
	}
}
