package auth

import (
	"context"
	"errors"
	"log/slog"
	"net/http"
	"studify/internal/auth/session"
	"studify/internal/auth/token"
	"studify/internal/httpx"
	"studify/internal/user"
	"studify/internal/util"
)

type sessionResponse struct {
	Authenticated bool       `json:"authenticated"`
	User          *user.User `json:"user,omitempty"`
}

func (h *Handler) CheckSession(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Cache-Control", "no-store")

	access, accessErr := h.Cookies.AccessToken(r)
	if accessErr == nil {
		current, err := h.Service.userFromAccess(r.Context(), access)
		if err != nil {
			sessionCheckFailed(w, r, err)
			return
		}
		if current != nil {
			util.WriteJSON(w, r, http.StatusOK, sessionResponse{Authenticated: true, User: current})
			return
		}
	}

	refresh, err := h.Cookies.RefreshToken(r)
	if err != nil {
		if accessErr == nil {
			h.Cookies.Clear(w)
		}
		util.WriteJSON(w, r, http.StatusOK, sessionResponse{})
		return
	}

	pair, err := h.Service.refreshTokens(r.Context(), refresh, session.InputFromRequest(r))
	switch {
	case errors.Is(err, errRefreshReplaced):
		// The browser may be receiving new cookies from another tab.
		httpx.WriteCodedError(w, http.StatusConflict, "session_already_refreshed", "session already refreshed")
		return
	case errors.Is(err, ErrInvalidToken), errors.Is(err, ErrTokenNotFound):
		h.Cookies.Clear(w)
		util.WriteJSON(w, r, http.StatusOK, sessionResponse{})
		return
	case err != nil:
		sessionCheckFailed(w, r, err)
		return
	}

	current, err := h.Service.userFromAccess(r.Context(), pair.Access)
	if err != nil {
		sessionCheckFailed(w, r, err)
		return
	}
	if current != nil {
		h.Cookies.Set(w, pair)
	}
	util.WriteJSON(w, r, http.StatusOK, sessionResponse{Authenticated: current != nil, User: current})
}

func (s *Service) userFromAccess(ctx context.Context, raw token.AccessToken) (*user.User, error) {
	id, sessionID, err := s.tokenManager.ParseAccess(raw)
	if err != nil {
		return nil, nil
	}
	active, err := s.sessions.IsActive(ctx, int64(id), sessionID)
	if err != nil || !active {
		return nil, err
	}
	current, err := user.GetUserByIDContext(ctx, s.db, int64(id))
	if errors.Is(err, user.ErrUserNotFound) {
		return nil, nil
	}
	return current, err
}

func sessionCheckFailed(w http.ResponseWriter, r *http.Request, err error) {
	slog.ErrorContext(r.Context(), "failed to check current session", util.AttrError(err))
	httpx.WriteError(w, "internal server error", http.StatusInternalServerError)
}
