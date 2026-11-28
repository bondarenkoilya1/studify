package studysearch

import (
	"database/sql"
	"log/slog"
	"net/http"
	"strconv"
	"strings"
	"studify/internal/httpx"
	"studify/internal/util"
	"time"
	_ "time/tzdata"
	"unicode/utf8"
)

const pageSize = 25

type Handler struct {
	DB *sql.DB
}

type result struct {
	Kind        string     `json:"kind"`
	ID          int64      `json:"id"`
	Name        string     `json:"name"`
	SubjectID   int64      `json:"subject_id"`
	SubjectName *string    `json:"subject_name"`
	Status      *string    `json:"status"`
	Deadline    *time.Time `json:"deadline"`
	DeadlineDay *string    `json:"deadline_date"`
	ExamDate    *time.Time `json:"exam_date"`
}

type page struct {
	Items   []result `json:"items"`
	HasMore bool     `json:"has_more"`
}

func (h *Handler) List(w http.ResponseWriter, r *http.Request) {
	userID, err := httpx.GetUserID(r)
	if err != nil {
		httpx.WriteError(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	query := r.URL.Query()
	text := strings.TrimSpace(query.Get("q"))
	kind, status, due, sortBy := query.Get("kind"), query.Get("status"), query.Get("due"), query.Get("sort")
	if utf8.RuneCountInString(text) > 100 || strings.ContainsRune(text, 0) ||
		!allowed(kind, "", "task", "subject") ||
		!allowed(status, "", "not_completed", "ongoing", "completed") ||
		!allowed(due, "", "today", "week", "overdue", "none") ||
		!allowed(sortBy, "", "recent", "name", "due", "subject", "status") {
		httpx.WriteError(w, "invalid search filters", http.StatusBadRequest)
		return
	}
	zone := query.Get("time_zone")
	if zone == "" {
		zone = "UTC"
	}
	if _, err := time.LoadLocation(zone); err != nil || zone == "Local" {
		httpx.WriteError(w, "time_zone must be an IANA time zone", http.StatusBadRequest)
		return
	}
	subjectID, err := numberParam(query.Get("subject_id"), 1)
	if err != nil {
		httpx.WriteError(w, "invalid subject_id", http.StatusBadRequest)
		return
	}
	offset, err := numberParam(query.Get("offset"), 0)
	if err != nil {
		httpx.WriteError(w, "invalid offset", http.StatusBadRequest)
		return
	}

	rows, err := h.DB.QueryContext(r.Context(), searchQuery, userID, text, kind, subjectID, status, due, zone, offset, sortBy, pageSize+1)
	if err != nil {
		writeFailure(w, r, err)
		return
	}
	defer rows.Close()

	response := page{Items: make([]result, 0, pageSize)}
	for rows.Next() {
		if len(response.Items) == pageSize {
			response.HasMore = true
			break
		}
		var item result
		if err := rows.Scan(&item.Kind, &item.ID, &item.Name, &item.SubjectID, &item.SubjectName,
			&item.Status, &item.Deadline, &item.DeadlineDay, &item.ExamDate); err != nil {
			writeFailure(w, r, err)
			return
		}
		response.Items = append(response.Items, item)
	}
	if err := rows.Err(); err != nil {
		writeFailure(w, r, err)
		return
	}
	util.WriteJSON(w, r, http.StatusOK, response)
}

func numberParam(value string, minimum int64) (int64, error) {
	if value == "" {
		return 0, nil
	}
	number, err := strconv.ParseInt(value, 10, 64)
	if err == nil && number < minimum {
		err = strconv.ErrSyntax
	}
	return number, err
}

func allowed(input string, options ...string) bool {
	for _, option := range options {
		if input == option {
			return true
		}
	}
	return false
}

func writeFailure(w http.ResponseWriter, r *http.Request, err error) {
	slog.ErrorContext(r.Context(), "failed to search study records", util.AttrError(err))
	httpx.WriteError(w, "internal server error", http.StatusInternalServerError)
}

const searchQuery = `
	WITH owned AS (
		SELECT id, name, note, exam_date FROM subjects WHERE user_id = $1
	), matching AS (
		SELECT 'subject' AS kind, s.id, s.name, s.id AS subject_id, NULL::text AS subject_name,
			NULL::text AS status, NULL::timestamptz AS deadline, NULL::text AS deadline_day, s.exam_date,
			s.exam_date AS sort_due, NULL::timestamptz AS created_at
		FROM owned s
		WHERE $3 <> 'task' AND $5 = '' AND $6 = ''
			AND ($4::bigint = 0 OR s.id = $4)
			AND ($2 = '' OR strpos(lower(s.name COLLATE pg_catalog."und-x-icu"), lower($2::text COLLATE pg_catalog."und-x-icu")) > 0 OR strpos(lower(s.note COLLATE pg_catalog."und-x-icu"), lower($2::text COLLATE pg_catalog."und-x-icu")) > 0)
		UNION ALL
		SELECT 'task', t.id, t.name, s.id, s.name, t.status, t.deadline,
			t.deadline_date::text, NULL::timestamptz,
			COALESCE((t.deadline_date + 1)::timestamp AT TIME ZONE $7, t.deadline), t.created_at
		FROM tasks t JOIN owned s ON s.id = t.subject_id
		CROSS JOIN LATERAL (
			SELECT COALESCE(t.deadline_date, (t.deadline AT TIME ZONE $7)::date) AS deadline,
				(statement_timestamp() AT TIME ZONE $7)::date AS today,
				CASE WHEN t.deadline_date IS NOT NULL
					THEN t.deadline_date < (statement_timestamp() AT TIME ZONE $7)::date
					ELSE t.deadline < statement_timestamp() END AS overdue
		) d
		WHERE $3 <> 'subject' AND ($4::bigint = 0 OR s.id = $4)
			AND ($5 = '' OR t.status = $5)
			AND ($2 = '' OR strpos(lower(t.name COLLATE pg_catalog."und-x-icu"), lower($2::text COLLATE pg_catalog."und-x-icu")) > 0
				OR strpos(lower(t.description COLLATE pg_catalog."und-x-icu"), lower($2::text COLLATE pg_catalog."und-x-icu")) > 0 OR strpos(lower(s.name COLLATE pg_catalog."und-x-icu"), lower($2::text COLLATE pg_catalog."und-x-icu")) > 0)
			AND CASE $6
				WHEN 'today' THEN d.deadline = d.today
				WHEN 'week' THEN d.deadline >= d.today AND d.deadline < d.today + 7 AND NOT d.overdue
				WHEN 'overdue' THEN t.status <> 'completed' AND d.overdue
				WHEN 'none' THEN d.deadline IS NULL
				ELSE true END
	)
	SELECT kind, id, name, subject_id, subject_name, status, deadline, deadline_day, exam_date
	FROM matching
	ORDER BY CASE WHEN $9 = 'name' THEN lower(name COLLATE pg_catalog."und-x-icu") END,
		CASE WHEN $9 = 'subject' THEN lower(COALESCE(subject_name, name) COLLATE pg_catalog."und-x-icu") END,
		CASE WHEN $9 = 'status' THEN
			CASE status WHEN 'ongoing' THEN 0 WHEN 'not_completed' THEN 1 WHEN 'completed' THEN 2 ELSE 3 END
		END,
		CASE WHEN $9 IN ('due', 'status') THEN sort_due END NULLS LAST,
		CASE WHEN $9 IN ('', 'recent') THEN created_at END DESC NULLS LAST,
		kind, id DESC
	LIMIT $10 OFFSET $8
`
