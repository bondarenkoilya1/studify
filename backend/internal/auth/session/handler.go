package session

import (
	"errors"
	"log/slog"
	"net/http"
	"studify/internal"
	"studify/internal/httpx"
	"studify/internal/util"
)

// GetUserSessions returns all active sessions of the authenticated user, newest first.
func (h *Handler) GetUserSessions(w http.ResponseWriter, r *http.Request) {
	userID, err := httpx.GetUserID(r)
	if err != nil {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	sessions, err := h.Service.ListSessions(r.Context(), internal.UserID(userID))
	if err != nil {
		slog.ErrorContext(r.Context(), "failed to list sessions",
			util.AttrUserID(userID),
			util.AttrError(err),
		)
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	util.WriteJSON(w, r, http.StatusOK, sessions)
}

func (h *Handler) GetSessions(w http.ResponseWriter, r *http.Request) {
	h.GetUserSessions(w, r)
}

// GetSession returns a single session by its ID for the authenticated user.
func (h *Handler) GetSession(w http.ResponseWriter, r *http.Request) {
	userID, err := httpx.GetUserID(r)
	if err != nil {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	id, err := httpx.GetID(r)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	sess, err := h.Service.GetSession(r.Context(), internal.UserID(userID), id)
	if err != nil {
		if errors.Is(err, ErrNotFoundSession) {
			http.Error(w, "session not found", http.StatusNotFound)
			return
		}

		slog.ErrorContext(r.Context(), "failed to get session",
			util.AttrUserID(userID),
			util.AttrSessionID(id),
			util.AttrError(err),
		)
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	util.WriteJSON(w, r, http.StatusOK, sess)
}

// RevokeSession deletes a single session by its ID for the authenticated user.
func (h *Handler) RevokeSession(w http.ResponseWriter, r *http.Request) {
	userID, err := httpx.GetUserID(r)
	if err != nil {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	id, err := httpx.GetID(r)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if err := h.Service.RevokeSession(r.Context(), internal.UserID(userID), id); err != nil {
		if errors.Is(err, ErrNotFoundSession) {
			http.Error(w, "session not found", http.StatusNotFound)
			return
		}

		slog.ErrorContext(r.Context(), "failed to revoke session",
			util.AttrUserID(userID),
			util.AttrSessionID(id),
			util.AttrError(err),
		)
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (h *Handler) DeleteSession(w http.ResponseWriter, r *http.Request) {
	h.RevokeSession(w, r)
}

// RevokeAllSessions deletes all active sessions of the authenticated user.
func (h *Handler) RevokeAllSessions(w http.ResponseWriter, r *http.Request) {
	userID, err := httpx.GetUserID(r)
	if err != nil {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	if err := h.Service.RevokeAllSessions(r.Context(), internal.UserID(userID)); err != nil {
		slog.ErrorContext(r.Context(), "failed to revoke all sessions",
			util.AttrUserID(userID),
			util.AttrError(err),
		)
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (h *Handler) DeleteUserSessions(w http.ResponseWriter, r *http.Request) {
	h.RevokeAllSessions(w, r)
}
