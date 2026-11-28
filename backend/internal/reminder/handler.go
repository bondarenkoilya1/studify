package reminder

import (
	"context"
	"database/sql"
	"errors"
	"log/slog"
	"net/http"
	"studify/internal"
	"studify/internal/httpx"
	"studify/internal/util"
	"time"
	_ "time/tzdata"

	"github.com/go-chi/chi/v5"
)

type Handler struct {
	DB *sql.DB
}

type input struct {
	LeadMinutes int    `json:"lead_minutes"`
	TimeZone    string `json:"time_zone"`
}

type state struct {
	Verified    bool       `json:"verified"`
	EventAt     *time.Time `json:"event_at"`
	LeadMinutes *int       `json:"lead_minutes"`
	SendAt      *time.Time `json:"send_at"`
	Outcome     *string    `json:"outcome"`
	TimeZone    string     `json:"time_zone"`
}

type target struct {
	selectEvent string
	column      string
}

var targets = map[string]target{
	"task": {
		column: "task_id",
		selectEvent: `
			SELECT u.is_email_verified,
				CASE WHEN t.status = 'completed' THEN NULL
					WHEN t.deadline_date IS NOT NULL THEN (t.deadline_date + 1)::timestamp AT TIME ZONE
						COALESCE(NULLIF($3, ''), r.time_zone, 'UTC')
					ELSE t.deadline END,
				r.lead_minutes, r.handled_for, r.outcome, COALESCE(NULLIF($3, ''), r.time_zone, 'UTC')
			FROM tasks t JOIN subjects s ON s.id = t.subject_id JOIN users u ON u.id = s.user_id
			LEFT JOIN study_reminders r ON r.task_id = t.id
			WHERE t.id = $1 AND s.user_id = $2`,
	},
	"subject": {
		column: "subject_id",
		selectEvent: `
			SELECT u.is_email_verified, s.exam_date, r.lead_minutes, r.handled_for, r.outcome,
				COALESCE(NULLIF($3, ''), r.time_zone, 'UTC')
			FROM subjects s JOIN users u ON u.id = s.user_id
			LEFT JOIN study_reminders r ON r.subject_id = s.id
			WHERE s.id = $1 AND s.user_id = $2`,
	},
}

func parseTarget(w http.ResponseWriter, r *http.Request) (target, int64, int64, bool) {
	userID, err := httpx.GetUserID(r)
	if err != nil {
		httpx.WriteError(w, "unauthorized", http.StatusUnauthorized)
		return target{}, 0, 0, false
	}
	id, err := httpx.GetID(r)
	t, ok := targets[chi.URLParam(r, "target")]
	if err != nil || id < 1 || !ok {
		httpx.WriteError(w, "invalid reminder target", http.StatusBadRequest)
		return target{}, 0, 0, false
	}
	return t, id, userID, true
}

func validZone(zone string) bool {
	if zone == "" || zone == "Local" || len(zone) > 100 {
		return false
	}
	_, err := time.LoadLocation(zone)
	return err == nil
}

func (h *Handler) Get(w http.ResponseWriter, r *http.Request) {
	t, id, userID, ok := parseTarget(w, r)
	if !ok {
		return
	}
	current, err := load(r.Context(), h.DB, t, id, userID, "")
	if writeError(w, r, err) {
		return
	}
	util.WriteJSON(w, r, http.StatusOK, current)
}

func (h *Handler) Put(w http.ResponseWriter, r *http.Request) {
	t, id, userID, ok := parseTarget(w, r)
	if !ok {
		return
	}
	var req input
	if err := httpx.ReadJSON(r.Body, &req); err != nil {
		httpx.WriteDecodeError(w, err)
		return
	}
	if req.LeadMinutes < 5 || req.LeadMinutes > 10080 || !validZone(req.TimeZone) {
		httpx.WriteError(w, "invalid reminder timing", http.StatusBadRequest)
		return
	}

	current, err := load(r.Context(), h.DB, t, id, userID, req.TimeZone)
	if writeError(w, r, err) {
		return
	}
	if !current.Verified {
		httpx.WriteCodedError(w, http.StatusConflict, "reminder_email_unverified", "confirm your email first")
		return
	}
	if current.EventAt == nil {
		httpx.WriteCodedError(w, http.StatusConflict, "reminder_date_required", "a future due or exam date is required")
		return
	}
	sendAt := current.EventAt.Add(-time.Duration(req.LeadMinutes) * time.Minute)
	if !sendAt.After(time.Now()) {
		httpx.WriteCodedError(w, http.StatusConflict, "reminder_time_passed", "reminder time has already passed")
		return
	}
	if current.Outcome != nil {
		httpx.WriteCodedError(w, http.StatusConflict, "reminder_already_handled", "a reminder was already processed for this event")
		return
	}

	// The column comes from the target table above, never from the request.
	_, err = h.DB.ExecContext(r.Context(), `
		INSERT INTO study_reminders (`+t.column+`, lead_minutes, time_zone) VALUES ($1,$2,$3)
		ON CONFLICT (`+t.column+`) DO UPDATE SET lead_minutes = EXCLUDED.lead_minutes, time_zone = EXCLUDED.time_zone
	`, id, req.LeadMinutes, req.TimeZone)
	if writeError(w, r, err) {
		return
	}
	current.LeadMinutes = &req.LeadMinutes
	current.SendAt = &sendAt
	util.WriteJSON(w, r, http.StatusOK, current)
}

func (h *Handler) Delete(w http.ResponseWriter, r *http.Request) {
	t, id, userID, ok := parseTarget(w, r)
	if !ok {
		return
	}
	if _, err := load(r.Context(), h.DB, t, id, userID, ""); writeError(w, r, err) {
		return
	}
	_, err := h.DB.ExecContext(r.Context(), "DELETE FROM study_reminders WHERE "+t.column+" = $1", id)
	if writeError(w, r, err) {
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func load(ctx context.Context, db internal.DBTX, t target, id, userID int64, zone string) (state, error) {
	var current state
	var handledFor *time.Time
	err := db.QueryRowContext(ctx, t.selectEvent, id, userID, zone).Scan(
		&current.Verified, &current.EventAt, &current.LeadMinutes, &handledFor, &current.Outcome, &current.TimeZone,
	)
	if err == nil {
		if current.EventAt == nil || handledFor == nil || !handledFor.Equal(*current.EventAt) {
			current.Outcome = nil
		}
		if current.EventAt != nil && current.LeadMinutes != nil && current.Outcome == nil {
			sendAt := current.EventAt.Add(-time.Duration(*current.LeadMinutes) * time.Minute)
			current.SendAt = &sendAt
		}
	}
	return current, err
}

func writeError(w http.ResponseWriter, r *http.Request, err error) bool {
	switch {
	case err == nil:
		return false
	case errors.Is(err, sql.ErrNoRows):
		httpx.WriteError(w, "reminder target not found", http.StatusNotFound)
	default:
		slog.ErrorContext(r.Context(), "failed to access study reminder", util.AttrError(err))
		httpx.WriteError(w, "internal server error", http.StatusInternalServerError)
	}
	return true
}
