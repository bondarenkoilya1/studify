package httpx

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestStrictJSONReportsUnknownFields(t *testing.T) {
	var body struct {
		Options struct {
			Enabled bool `json:"enabled"`
		} `json:"options"`
	}
	err := ReadJSON(strings.NewReader(`{"options":{"enabled":true,"typo":false}}`), &body)
	if err == nil {
		t.Fatal("accepted an unknown nested field")
	}
	response := httptest.NewRecorder()
	WriteDecodeError(response, err)
	var result ErrorBody
	if err := json.Unmarshal(response.Body.Bytes(), &result); err != nil {
		t.Fatal(err)
	}
	if response.Code != http.StatusBadRequest || result.Code != "unknown_field" || !strings.Contains(result.Message, "typo") {
		t.Fatalf("unexpected error response: %d %+v", response.Code, result)
	}
}

func TestWriteErrorRedactsInternalDetails(t *testing.T) {
	response := httptest.NewRecorder()
	WriteError(response, "database details", http.StatusInternalServerError)
	if response.Header().Get("Content-Type") != "application/json" ||
		!strings.Contains(response.Body.String(), `"code":"internal_error"`) ||
		strings.Contains(response.Body.String(), "database details") {
		t.Fatalf("unexpected error response: %s", response.Body)
	}
}
