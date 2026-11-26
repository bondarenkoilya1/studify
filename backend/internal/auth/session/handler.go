package session

import (
	"errors"
	"log/slog"
	"net/http"
	"studify/internal/httpx"
	"studify/internal/util"
)

// GetUserSessions returns all active sessions of the authenticated user, newest first.
func (h *Handler) GetUserSessions(w http.ResponseWriter, r *http.Request) {
	userID, err := httpx.GetUserID(r)
	if err != nil {
		httpx.WriteError(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	sessions, err := h.Service.ListSessions(r.Context(), userID)
	if err != nil {
		slog.ErrorContext(r.Context(), "failed to list sessions",
			util.AttrUserID(userID),
			util.AttrError(err),
		)
		httpx.WriteError(w, "internal server error", http.StatusInternalServerError)
		return
	}

	currentID := httpx.GetSessionID(r)
	for _, sess := range sessions {
		sess.IsCurrent = sess.ID == currentID
	}
	w.Header().Set("Cache-Control", "no-store")
	util.WriteJSON(w, r, http.StatusOK, sessions)
}

// GetSession returns a single session by its ID for the authenticated user.
func (h *Handler) GetSession(w http.ResponseWriter, r *http.Request) {
	userID, err := httpx.GetUserID(r)
	if err != nil {
		httpx.WriteError(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	id, err := httpx.GetID(r)
	if err != nil {
		httpx.WriteError(w, err.Error(), http.StatusBadRequest)
		return
	}

	sess, err := h.Service.GetSession(r.Context(), userID, id)
	if err != nil {
		if errors.Is(err, ErrNotFoundSession) {
			httpx.WriteError(w, "session not found", http.StatusNotFound)
			return
		}

		slog.ErrorContext(r.Context(), "failed to get session",
			util.AttrUserID(userID),
			util.AttrSessionID(id),
			util.AttrError(err),
		)
		httpx.WriteError(w, "internal server error", http.StatusInternalServerError)
		return
	}

	sess.IsCurrent = sess.ID == httpx.GetSessionID(r)
	w.Header().Set("Cache-Control", "no-store")
	util.WriteJSON(w, r, http.StatusOK, sess)
}

// RevokeSession deletes a single session by its ID for the authenticated user.
func (h *Handler) RevokeSession(w http.ResponseWriter, r *http.Request) {
	userID, err := httpx.GetUserID(r)
	if err != nil {
		httpx.WriteError(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	id, err := httpx.GetID(r)
	if err != nil {
		httpx.WriteError(w, err.Error(), http.StatusBadRequest)
		return
	}

	if err := h.Service.RevokeSession(r.Context(), userID, id); err != nil {
		if errors.Is(err, ErrNotFoundSession) {
			httpx.WriteError(w, "session not found", http.StatusNotFound)
			return
		}

		slog.ErrorContext(r.Context(), "failed to revoke session",
			util.AttrUserID(userID),
			util.AttrSessionID(id),
			util.AttrError(err),
		)
		httpx.WriteError(w, "internal server error", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// RevokeAllSessions deletes all active sessions of the authenticated user.
func (h *Handler) RevokeAllSessions(w http.ResponseWriter, r *http.Request) {
	userID, err := httpx.GetUserID(r)
	if err != nil {
		httpx.WriteError(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	if err := h.Service.RevokeAllSessions(r.Context(), userID); err != nil {
		slog.ErrorContext(r.Context(), "failed to revoke all sessions",
			util.AttrUserID(userID),
			util.AttrError(err),
		)
		httpx.WriteError(w, "internal server error", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
