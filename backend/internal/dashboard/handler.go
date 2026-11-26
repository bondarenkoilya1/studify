package dashboard

import (
	"log/slog"
	"net/http"
	"studify/internal/httpx"
	"studify/internal/util"
)

func (h *Handler) GetDashboardStatus(w http.ResponseWriter, r *http.Request) {
	userID, err := httpx.GetUserID(r)
	if err != nil {
		httpx.WriteError(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	status, err := getStatus(r.Context(), h.DB, userID)
	if err != nil {
		slog.ErrorContext(r.Context(), "failed to get dashboard status",
			util.AttrUserID(userID),
			util.AttrError(err),
		)
		httpx.WriteError(w, "internal server error", http.StatusInternalServerError)
		return
	}

	util.WriteJSON(w, r, http.StatusOK, status)
}
