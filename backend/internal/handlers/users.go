package handlers

import (
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"studify/internal/database"
	"studify/internal/models"
	"studify/internal/utils"

	"github.com/go-chi/chi/v5"
)

func (h *Handler) GetUsers(w http.ResponseWriter, _ *http.Request) {
	users, err := database.GetUsers(h.DB)
	if err != nil {
		log.Printf("failed to get users: %v", err)
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err = json.NewEncoder(w).Encode(users); err != nil {
		log.Printf("failed to encode users to JSON: %v", err)
	}
}

func (h *Handler) GetCurrentUser(w http.ResponseWriter, r *http.Request) {
	userID, err := utils.GetUserID(r)
	if err != nil {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	user, err := database.GetUserByID(h.DB, userID)
	if err != nil {
		if errors.Is(err, database.ErrUserNotFound) {
			http.Error(w, "user not found", http.StatusNotFound)
			return
		}

		log.Printf("failed to get current user: %v", err)
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err = json.NewEncoder(w).Encode(user); err != nil {
		log.Printf("failed to encode current user to JSON: %v", err)
	}
}

func (h *Handler) ReplaceUser(w http.ResponseWriter, r *http.Request) {
	currentUsername := chi.URLParam(r, "username")
	if currentUsername == "" {
		http.Error(w, "missing username", http.StatusBadRequest)
		return
	}

	body := models.UserRequest{}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	if err := utils.ValidateCredentials(body, models.AuthActionRegister); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	passwordHash, err := utils.HashPassword(body.Password)
	if err != nil {
		log.Printf("failed to hash password: %v", err)
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	user, err := database.UpdateUser(h.DB, currentUsername, body.Username, passwordHash)
	if err != nil {
		if errors.Is(err, database.ErrUserNotFound) {
			http.Error(w, fmt.Sprintf("No such user with username: %s", currentUsername), http.StatusNotFound)
			return
		}

		if errors.Is(err, database.ErrUserAlreadyExists) {
			http.Error(w, "user with such username already exists", http.StatusConflict)
			return
		}

		log.Printf("failed to replace user: %v", err)
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	if err = h.Auth.SetAccessTokenCookies(models.UserID(user.ID), w); err != nil {
		log.Printf("failed to set access token cookie: %v", err)
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	if err = json.NewEncoder(w).Encode(user); err != nil {
		log.Printf("user was changed. Failed to return as JSON because of encoding error: %v", err)
	}
}

func (h *Handler) UpdateUser(w http.ResponseWriter, r *http.Request) {
	currentUsername := chi.URLParam(r, "username")
	if currentUsername == "" {
		http.Error(w, "missing username", http.StatusBadRequest)
		return
	}

	var req *models.UpdateUserRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	if req == nil || req.Username == nil && req.Password == nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	currentUser, err := database.GetUserByUsername(h.DB, currentUsername)
	if err != nil {
		if errors.Is(err, database.ErrUserNotFound) {
			http.Error(w, fmt.Sprintf("No such user with username: %s", currentUsername), http.StatusNotFound)
			return
		}

		log.Printf("failed to get user: %v", err)
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	username := currentUser.Username
	if req.Username != nil {
		if *req.Username == "" {
			http.Error(w, "username is empty", http.StatusBadRequest)
			return
		}
		username = *req.Username
	}

	password := currentUser.Password
	if req.Password != nil {
		if *req.Password == "" {
			http.Error(w, "password is empty", http.StatusBadRequest)
			return
		}

		if len(*req.Password) > 72 {
			http.Error(w, "password is too long", http.StatusBadRequest)
			return
		}

		passwordHash, err := utils.HashPassword(*req.Password)
		if err != nil {
			log.Printf("failed to hash password: %v", err)
			http.Error(w, "internal server error", http.StatusInternalServerError)
			return
		}

		password = passwordHash
	}

	user, err := database.UpdateUser(h.DB, currentUsername, username, password)
	if err != nil {
		if errors.Is(err, database.ErrUserNotFound) {
			http.Error(w, fmt.Sprintf("No such user with username: %s", currentUsername), http.StatusNotFound)
			return
		}

		if errors.Is(err, database.ErrUserAlreadyExists) {
			http.Error(w, "user with such username already exists", http.StatusConflict)
			return
		}

		log.Printf("failed to update user: %v", err)
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err = json.NewEncoder(w).Encode(user); err != nil {
		log.Printf("user was changed. Failed to return as JSON because of encoding error: %v", err)
	}
}

func (h *Handler) DeleteUsers(w http.ResponseWriter, _ *http.Request) {
	if err := database.DeleteUsers(h.DB); err != nil {
		log.Printf("failed to delete users: %v", err)
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (h *Handler) DeleteUser(w http.ResponseWriter, r *http.Request) {
	username := chi.URLParam(r, "username")
	if username == "" {
		http.Error(w, "missing username", http.StatusBadRequest)
		return
	}

	if err := database.DeleteUser(h.DB, username); err != nil {
		if errors.Is(err, database.ErrUserNotFound) {
			http.Error(w, fmt.Sprintf("No such user with username: %s", username), http.StatusNotFound)
			return
		}

		log.Printf("failed to delete user: %v", err)
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
