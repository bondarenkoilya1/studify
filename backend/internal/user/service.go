package user

import (
	"database/sql"
	"errors"
	"fmt"
	"net/http"
	"studify/internal/httpx"
)

func CurrentUser(r *http.Request, db *sql.DB) (*User, error) {
	userID, err := httpx.GetUserID(r)
	if err != nil {
		return nil, err
	}

	currentUser, err := GetUserByID(db, userID)
	if err != nil {
		if errors.Is(err, ErrUserNotFound) {
			return nil, ErrUserNotFound
		}

		return nil, fmt.Errorf("get current user: %w", err)
	}

	return currentUser, nil
}
