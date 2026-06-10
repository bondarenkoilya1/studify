package handlers

import (
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"studify/internal/database"
	"studify/internal/models"

	"golang.org/x/crypto/bcrypt"
)

// check on empty password
func (h *Handler) RegisterUser(w http.ResponseWriter, r *http.Request) {
	request := models.UserRequest{}

	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		http.Error(w, fmt.Sprintf("Failed to read data: %v", err), http.StatusBadRequest)
		return
	}

	if len(request.Password) > 72 {
		http.Error(w, "password is too long", http.StatusBadRequest)
		return
	}

	passwordHash, err := HashPassword(request.Password)
	if err != nil {
		http.Error(w, "failed to hash password", http.StatusInternalServerError)
		return
	}

	newUser, err := database.InsertUser(h.DB, request.Username, passwordHash)
	if err != nil {
		if errors.Is(err, database.ErrUserAlreadyExists) {
			http.Error(w, "Failed to register user. User with such name is already exists", http.StatusConflict)
			return
		}

		http.Error(w, fmt.Sprintf("Failed to register user: %v", err), http.StatusInternalServerError)
		return
	}

	if err = json.NewEncoder(w).Encode(newUser); err != nil {
		log.Printf("Failed to encode user to JSON: %v", err)
	}
}

func (h *Handler) LoginUser(w http.ResponseWriter, r *http.Request) {
	request := models.UserRequest{}

	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		http.Error(w, fmt.Sprintf("Failed to read data: %v", err), http.StatusBadRequest)
		return
	}

	if len(request.Password) > 72 {
		http.Error(w, "password is too long", http.StatusBadRequest)
		return
	}

	passwordHash, err := HashPassword(request.Password)
	if err != nil {
		http.Error(w, "failed to hash password", http.StatusInternalServerError)
		return
	}

}

func HashPassword(password string) (string, error) {
	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return "", fmt.Errorf("failed to hash password: %w", err)
	}

	return string(hash), nil
}
