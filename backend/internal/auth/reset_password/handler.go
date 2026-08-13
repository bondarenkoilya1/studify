package reset_password

import (
	"encoding/json"
	"log"
	"net/http"
)

type incomingEmail struct {
	Email string `json:"email"`
}

func (h *Handler) SendResetPasswordEmail(w http.ResponseWriter, r *http.Request) {
	body := incomingEmail{}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		log.Printf("failed to decode request body: %v", err)
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	if body.Email == "" {
		http.Error(w, "Email is required", http.StatusBadRequest)
		return
	}

	if err := h.sendConfirmationEmail(body.Email); err != nil {
		log.Printf("failed to send confirmation email: %v", err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
