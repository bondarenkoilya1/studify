package httpx

import (
	"fmt"
	"net/http"
	"studify/internal/auth"
	"studify/internal/models"
)

func GetUserID(r *http.Request) (int64, error) {
	userID := r.Context().Value(models.UserIDKey)
	switch id := userID.(type) {
	case auth.UserID:
		return int64(id), nil
	case int64:
		return id, nil
	default:
		return 0, fmt.Errorf("missing user ID")
	}
}
