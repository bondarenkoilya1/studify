package httpx

import (
	"fmt"
	"net/http"
	"studify/internal"
)

type ContextKey string

const (
	UserIDKey    ContextKey = "userID"
	SessionIDKey ContextKey = "sessionID"
)

func GetSessionID(r *http.Request) int64 {
	id, _ := r.Context().Value(SessionIDKey).(int64)
	return id
}

func GetUserID(r *http.Request) (int64, error) {
	userID := r.Context().Value(UserIDKey)
	switch id := userID.(type) {
	case internal.UserID:
		return int64(id), nil
	case int64:
		return id, nil
	default:
		return 0, fmt.Errorf("missing user ID")
	}
}
