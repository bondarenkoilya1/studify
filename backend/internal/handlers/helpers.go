package handlers

import (
	"fmt"
	"net/http"
	"strconv"
	"studify/internal/auth"
	"studify/internal/models"

	"github.com/go-chi/chi/v5"
)

func getID(r *http.Request) (int64, error) {
	idStr := chi.URLParam(r, "id")
	if idStr == "" {
		return 0, fmt.Errorf("missing ID")
	}

	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		return 0, fmt.Errorf("ID must be an integer")
	}

	return id, nil
}

func getUserID(r *http.Request) (int64, error) {
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
