package handlers

import (
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"studify/internal/database"
	"studify/internal/models"

	"github.com/go-chi/chi/v5"
	"golang.org/x/crypto/bcrypt"
)

type authAction string

const (
	authActionRegister authAction = "register"
	authActionLogin    authAction = "login"
)

func (h *Handler) RegisterUser(w http.ResponseWriter, r *http.Request) {
	body := models.UserRequest{}

	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, fmt.Sprintf("Failed to read data: %v", err), http.StatusBadRequest)
		return
	}

	if err := validateBody(body, authActionRegister); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	passwordHash, err := HashPassword(body.Password)
	if err != nil {
		http.Error(w, "failed to hash password", http.StatusInternalServerError)
		return
	}

	newUser, err := database.InsertUser(h.DB, body.Username, passwordHash)
	if err != nil {
		if errors.Is(err, database.ErrUserAlreadyExists) {
			http.Error(w, "user with such username already exists", http.StatusConflict)
			return
		}

		http.Error(w, fmt.Sprintf("Failed to register user: %v", err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	if err = json.NewEncoder(w).Encode(newUser); err != nil {
		log.Printf("failed to encode user to JSON: %v", err)
	}
}

func (h *Handler) GetUsers(w http.ResponseWriter, _ *http.Request) {
	users, err := database.GetUsers(h.DB)
	if err != nil {
		http.Error(w, "Failed to get users", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err = json.NewEncoder(w).Encode(users); err != nil {
		log.Printf("failed to encode users to JSON: %v", err)
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

	if err := validateBody(body, authActionRegister); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	passwordHash, err := HashPassword(body.Password)
	if err != nil {
		http.Error(w, "failed to hash password", http.StatusInternalServerError)
		return
	}

	user, err := database.UpdateUser(h.DB, currentUsername, body.Username, passwordHash)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			http.Error(w, fmt.Sprintf("No such user with username: %s", currentUsername), http.StatusNotFound)
			return
		}

		if errors.Is(err, database.ErrUserAlreadyExists) {
			http.Error(w, "user with such username already exists", http.StatusConflict)
			return
		}

		http.Error(w, "Failed to replace user", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err = json.NewEncoder(w).Encode(user); err != nil {
		log.Printf("user was changed. Failed to return as JSON because of encoding error: %v", err)
	}
}

func (h *Handler) DeleteUsers(w http.ResponseWriter, _ *http.Request) {
	if err := database.DeleteUsers(h.DB); err != nil {
		http.Error(w, "Failed to delete users", http.StatusInternalServerError)
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
		if errors.Is(err, sql.ErrNoRows) {
			http.Error(w, fmt.Sprintf("No such user with username: %s", username), http.StatusNotFound)
			return
		}

		http.Error(w, "Failed to delete user", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (h *Handler) LoginUser(w http.ResponseWriter, r *http.Request) {
	body := models.UserRequest{}

	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, fmt.Sprintf("failed to read data: %v", err), http.StatusBadRequest)
		return
	}

	if err := validateBody(body, authActionLogin); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	user, err := database.GetUserByUsername(h.DB, body.Username)
	if err != nil {
		http.Error(w, "invalid username or password", http.StatusUnauthorized)
		return
	}

	err = bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(body.Password))
	if err != nil {
		http.Error(w, "invalid username or password", http.StatusUnauthorized)
		return
	}

	w.WriteHeader(http.StatusOK)
}

func validateBody(body models.UserRequest, action authAction) error {
	if body.Username == "" {
		return errors.New("username is empty")
	}

	if body.Password == "" {
		return errors.New("password is empty")
	}

	if len(body.Password) > 72 && action == authActionRegister {
		return errors.New("password is too long")
	}

	return nil
}
