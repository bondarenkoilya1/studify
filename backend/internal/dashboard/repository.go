package dashboard

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"math"
)

const ownedTasks = `
	WITH owned_subjects AS (
		SELECT id, name FROM subjects WHERE user_id = $1
	), owned_tasks AS (
		SELECT t.id, t.subject_id, t.name, t.description, t.status, t.deadline, t.deadline_date,
			t.scheduled_at, t.scheduled_date, t.estimated_time,
			CASE WHEN t.deadline_date IS NOT NULL
				THEN (t.deadline_date + 1)::timestamp AT TIME ZONE $2
				ELSE t.deadline
			END AS cutoff,
			COALESCE(CASE WHEN t.deadline_date IS NOT NULL
				THEN t.deadline_date < (statement_timestamp() AT TIME ZONE $2)::date
				ELSE t.deadline < statement_timestamp()
			END, false) AS overdue
		FROM tasks t JOIN owned_subjects s ON s.id = t.subject_id
	)
`

func getStatus(ctx context.Context, db *sql.DB, userID int64, zone string, offset int) (*Status, error) {
	const query = ownedTasks + `
		, overdue_page AS (
			SELECT * FROM owned_tasks WHERE status <> 'completed' AND overdue
			ORDER BY cutoff DESC, id DESC LIMIT 10 OFFSET $3
		), upcoming AS (
			SELECT * FROM owned_tasks
			WHERE status <> 'completed' AND cutoff IS NOT NULL AND NOT overdue
			ORDER BY cutoff, id LIMIT 1
		)
		SELECT
			(SELECT COUNT(*) FROM owned_subjects),
			COUNT(*),
			COUNT(*) FILTER (WHERE status = 'completed'),
			COUNT(*) FILTER (WHERE status = 'ongoing'),
			COUNT(*) FILTER (WHERE status = 'not_completed'),
			(SELECT to_jsonb(upcoming) - '{cutoff,overdue,scheduled_at,scheduled_date,estimated_time}'::text[] FROM upcoming),
			COALESCE((
				SELECT jsonb_agg(to_jsonb(p) - '{cutoff,overdue,scheduled_at,scheduled_date,estimated_time}'::text[]
					ORDER BY cutoff DESC, id DESC) FROM overdue_page p
			), '[]'::jsonb),
			COUNT(*) FILTER (WHERE status <> 'completed' AND overdue)
		FROM owned_tasks;
	`

	var status Status
	var nearest, overdue []byte
	err := db.QueryRowContext(ctx, query, userID, zone, offset).Scan(
		&status.TotalSubjects, &status.TotalTasks, &status.TotalCompletedTasks,
		&status.TotalOngoingTasks, &status.TotalNotCompleted, &nearest, &overdue, &status.OverdueTotal,
	)
	if err != nil {
		return nil, fmt.Errorf("read dashboard snapshot: %w", err)
	}
	if len(nearest) != 0 {
		if err := json.Unmarshal(nearest, &status.NearestDeadlineTask); err != nil {
			return nil, fmt.Errorf("decode nearest deadline: %w", err)
		}
	}
	if err := json.Unmarshal(overdue, &status.OverdueTasks); err != nil {
		return nil, fmt.Errorf("decode overdue tasks: %w", err)
	}
	if status.TotalTasks != 0 {
		status.CompletionPercent = math.Round(10000*float64(status.TotalCompletedTasks)/float64(status.TotalTasks)) / 100
	}

	return &status, nil
}

func getStudyPlan(ctx context.Context, db *sql.DB, userID int64, zone string, offset int) (json.RawMessage, error) {
	const query = ownedTasks + `
		, overdue_page AS (
			SELECT * FROM owned_tasks WHERE status <> 'completed' AND overdue
			ORDER BY cutoff, id LIMIT 10 OFFSET $3
		)
		SELECT jsonb_build_object(
			'subjects', COALESCE((SELECT jsonb_agg(to_jsonb(s) ORDER BY id) FROM owned_subjects s), '[]'::jsonb),
			'total_tasks', COUNT(*),
			'total_completed_tasks', COUNT(*) FILTER (WHERE status = 'completed'),
			'total_ongoing_tasks', COUNT(*) FILTER (WHERE status = 'ongoing'),
			'overdue_total', COUNT(*) FILTER (WHERE status <> 'completed' AND overdue),
			'as_of', statement_timestamp(),
			'tasks', COALESCE(
				jsonb_agg(to_jsonb(t) - '{description,cutoff,overdue}'::text[] ORDER BY id)
					FILTER (WHERE status <> 'completed' AND NOT overdue),
				'[]'::jsonb
			),
			'overdue_tasks', COALESCE((
				SELECT jsonb_agg(to_jsonb(p) - '{description,cutoff,overdue}'::text[] ORDER BY cutoff, id)
				FROM overdue_page p
			), '[]'::jsonb)
		)
		FROM owned_tasks t
	`
	var data json.RawMessage
	err := db.QueryRowContext(ctx, query, userID, zone, offset).Scan(&data)
	return data, err
}
