package middlewares

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/google/uuid"
)

func TestRequestIDUsesOnlyUUIDs(t *testing.T) {
	validID := uuid.NewString()
	handler := RequestID(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusNoContent)
	}))

	for _, input := range []string{validID, "", "malformed", strings.Repeat("a", 1000)} {
		r := httptest.NewRequest(http.MethodGet, "/", nil)
		r.Header.Set(correlationHeader, input)
		w := httptest.NewRecorder()
		handler.ServeHTTP(w, r)

		id := w.Header().Get(correlationHeader)
		if err := uuid.Validate(id); err != nil {
			t.Fatalf("response correlation ID is invalid: %v", err)
		}
		if input == validID && id != validID {
			t.Fatal("valid client correlation ID was replaced")
		}
	}
}
