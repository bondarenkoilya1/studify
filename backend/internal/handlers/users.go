package handlers

import (
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"strings"
	"studify/internal/database"
	"studify/internal/models"
)

func (h *Handler) RegisterUser(w http.ResponseWriter, r *http.Request) {
	if !strings.Contains(r.Header.Get("Content-Type"), "application/json") {
		http.Error(w, "You need to use the following header -> Content-Type: application/json", http.StatusUnsupportedMediaType)
		return
	}

	request := models.UserRequest{}

	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		http.Error(w, fmt.Sprintf("Failed to read data: %v", err), http.StatusBadRequest)
		return
	}

	newUser, err := database.InsertUser(h.DB, request.Username, request.Password)
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
