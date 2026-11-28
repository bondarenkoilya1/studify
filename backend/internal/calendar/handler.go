package calendar

import (
	"database/sql"
	"encoding/json"
	"log/slog"
	"net/http"
	"studify/internal/httpx"
	"studify/internal/util"
	"time"
	_ "time/tzdata"
)

type Handler struct {
	DB *sql.DB
}

func (h *Handler) List(w http.ResponseWriter, r *http.Request) {
	userID, err := httpx.GetUserID(r)
	if err != nil {
		httpx.WriteError(w, "unauthorized", http.StatusUnauthorized)
		return
	}
	params := r.URL.Query()
	startDate, endDate := params.Get("start_date"), params.Get("end_date")
	first, firstErr := time.Parse(time.DateOnly, startDate)
	last, lastErr := time.Parse(time.DateOnly, endDate)
	if firstErr != nil || lastErr != nil || first.Year() < 1 ||
		!last.After(first) || last.Sub(first) > 62*24*time.Hour {
		httpx.WriteError(w, "calendar range must be between 1 and 62 days", http.StatusBadRequest)
		return
	}
	zone := params.Get("time_zone")
	if zone == "" {
		zone = "UTC"
	}
	location, err := time.LoadLocation(zone)
	if err != nil || zone == "Local" {
		httpx.WriteError(w, "time_zone must be an IANA time zone", http.StatusBadRequest)
		return
	}
	// Construct each boundary in the viewer's time zone for legacy timed events.
	start := time.Date(first.Year(), first.Month(), first.Day(), 0, 0, 0, 0, location)
	end := time.Date(last.Year(), last.Month(), last.Day(), 0, 0, 0, 0, location)

	var data json.RawMessage
	err = h.DB.QueryRowContext(r.Context(), listQuery, userID, startDate, endDate, start, end).Scan(&data)
	if err != nil {
		slog.ErrorContext(r.Context(), "failed to list calendar events",
			util.AttrError(err),
			util.AttrUserID(userID),
		)
		httpx.WriteError(w, "internal server error", http.StatusInternalServerError)
		return
	}

	util.WriteJSON(w, r, http.StatusOK, data)
}

const listQuery = `
	WITH owned_subjects AS (
		SELECT id, name, scope, exam_type, exam_date FROM subjects WHERE user_id = $1
	), period_tasks AS (
		SELECT t.id, t.subject_id, t.name, t.status, t.estimated_time,
			t.scheduled_date, t.scheduled_at, t.deadline_date, t.deadline
		FROM tasks t JOIN owned_subjects s ON s.id = t.subject_id
		WHERE t.status <> 'completed' AND (
			(t.scheduled_date >= $2::text::date AND t.scheduled_date < $3::text::date) OR
			(t.scheduled_date IS NULL AND t.scheduled_at < $5 AND
				t.scheduled_at + make_interval(mins => COALESCE(t.estimated_time, 60)) > $4) OR
			(t.deadline_date >= $2::text::date AND t.deadline_date < $3::text::date) OR
			(t.deadline_date IS NULL AND t.deadline >= $4 AND t.deadline < $5)
		)
	), relevant_subjects AS (
		SELECT id, name, scope, exam_type,
			CASE WHEN exam_date >= $4 AND exam_date < $5 THEN exam_date END AS exam_date
		FROM owned_subjects
		WHERE (exam_date >= $4 AND exam_date < $5) OR id IN (SELECT subject_id FROM period_tasks)
	)
	SELECT jsonb_build_object(
		'subjects', COALESCE((SELECT jsonb_agg(to_jsonb(s) ORDER BY id) FROM relevant_subjects s), '[]'::jsonb),
		'tasks', COALESCE((SELECT jsonb_agg(to_jsonb(t) ORDER BY id) FROM period_tasks t), '[]'::jsonb)
	)
`
