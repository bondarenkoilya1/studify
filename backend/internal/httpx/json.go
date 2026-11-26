package httpx

import (
	"encoding/json"
	"io"
	"net/http"
	"strings"
)

type ErrorBody struct {
	Code    string `json:"code"`
	Message string `json:"message"`
}

func WriteError(w http.ResponseWriter, message string, status int) {
	code := "request_failed"
	switch status {
	case http.StatusBadRequest:
		code = "bad_request"
	case http.StatusUnauthorized:
		code = "unauthorized"
	case http.StatusForbidden:
		code = "forbidden"
	case http.StatusNotFound:
		code = "not_found"
	case http.StatusMethodNotAllowed:
		code = "method_not_allowed"
	case http.StatusConflict:
		code = "conflict"
	case http.StatusRequestEntityTooLarge:
		code = "payload_too_large"
	case http.StatusUnsupportedMediaType:
		code = "unsupported_media_type"
	case http.StatusUnprocessableEntity:
		code = "unprocessable_entity"
	case http.StatusTooManyRequests:
		code = "rate_limited"
	default:
		if status >= http.StatusInternalServerError {
			code = "internal_error"
			message = "internal server error"
		}
	}
	WriteCodedError(w, status, code, message)
}

func WriteCodedError(w http.ResponseWriter, status int, code, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("X-Content-Type-Options", "nosniff")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(ErrorBody{Code: code, Message: message})
}

func ReadJSON(body io.Reader, value any) error {
	decoder := json.NewDecoder(body)
	decoder.DisallowUnknownFields()
	return decoder.Decode(value)
}

func WriteDecodeError(w http.ResponseWriter, err error) {
	if field, found := strings.CutPrefix(err.Error(), "json: unknown field "); found {
		WriteCodedError(w, http.StatusBadRequest, "unknown_field", "unknown JSON field "+field)
		return
	}
	WriteCodedError(w, http.StatusBadRequest, "invalid_json", "invalid JSON body")
}
