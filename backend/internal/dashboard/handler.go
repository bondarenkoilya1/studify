package dashboard

import (
	"log/slog"
	"net/http"
	"studify/internal/httpx"
	"studify/internal/util"
	"time"
	_ "time/tzdata"
)

func (h *Handler) GetDashboardStatus(w http.ResponseWriter, r *http.Request) {
	userID, err := httpx.GetUserID(r)
	if err != nil {
		httpx.WriteError(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	zone := r.URL.Query().Get("time_zone")
	if zone == "" {
		zone = "UTC"
	}
	if _, err := time.LoadLocation(zone); err != nil || zone == "Local" {
		httpx.WriteError(w, "time_zone must be an IANA time zone", http.StatusBadRequest)
		return
	}

	status, err := getStatus(r.Context(), h.DB, userID, zone)
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
