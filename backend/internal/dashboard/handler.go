package dashboard

import (
	"log/slog"
	"net/http"
	"strconv"
	"studify/internal/httpx"
	"studify/internal/util"
	"time"
	_ "time/tzdata"
)

func (h *Handler) GetDashboardStatus(w http.ResponseWriter, r *http.Request) {
	h.writeDashboard(w, r, false)
}

func (h *Handler) GetStudyPlan(w http.ResponseWriter, r *http.Request) {
	h.writeDashboard(w, r, true)
}

func (h *Handler) writeDashboard(w http.ResponseWriter, r *http.Request, studyPlan bool) {
	userID, err := httpx.GetUserID(r)
	if err != nil {
		httpx.WriteError(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	query := r.URL.Query()
	zone := query.Get("time_zone")
	if zone == "" {
		zone = "UTC"
	}
	if _, err := time.LoadLocation(zone); err != nil || zone == "Local" {
		httpx.WriteError(w, "time_zone must be an IANA time zone", http.StatusBadRequest)
		return
	}
	offset := 0
	if raw := query.Get("overdue_offset"); raw != "" {
		offset, err = strconv.Atoi(raw)
		if err != nil || offset < 0 {
			httpx.WriteError(w, "overdue_offset must be a non-negative integer", http.StatusBadRequest)
			return
		}
	}

	var data any
	if studyPlan {
		data, err = getStudyPlan(r.Context(), h.DB, userID, zone, offset)
	} else {
		data, err = getStatus(r.Context(), h.DB, userID, zone, offset)
	}
	if err != nil {
		slog.ErrorContext(r.Context(), "failed to get dashboard snapshot",
			util.AttrUserID(userID),
			util.AttrError(err),
		)
		httpx.WriteError(w, "internal server error", http.StatusInternalServerError)
		return
	}

	util.WriteJSON(w, r, http.StatusOK, data)
}
