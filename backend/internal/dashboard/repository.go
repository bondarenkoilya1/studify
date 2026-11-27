package dashboard

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"math"
)

func getStatus(ctx context.Context, db *sql.DB, userID int64, zone string) (*Status, error) {
	const query = `
		WITH owned_subjects AS (
			SELECT id FROM subjects WHERE user_id = $1
		), owned_tasks AS (
			SELECT t.id, t.subject_id, t.name, t.description, t.status, t.deadline, t.deadline_date,
				CASE WHEN t.deadline_date IS NOT NULL
					THEN (t.deadline_date + 1)::timestamp AT TIME ZONE $2
					ELSE t.deadline
				END AS cutoff,
				CASE WHEN t.deadline_date IS NOT NULL
					THEN t.deadline_date < (statement_timestamp() AT TIME ZONE $2)::date
					ELSE t.deadline < statement_timestamp()
				END AS overdue
			FROM tasks t JOIN owned_subjects s ON s.id = t.subject_id
		), upcoming AS (
			SELECT * FROM owned_tasks
			WHERE status <> 'completed' AND NOT overdue
			ORDER BY cutoff, id LIMIT 1
		)
		SELECT
			(SELECT COUNT(*) FROM owned_subjects),
			COUNT(*),
			COUNT(*) FILTER (WHERE status = 'completed'),
			COUNT(*) FILTER (WHERE status = 'ongoing'),
			COUNT(*) FILTER (WHERE status = 'not_completed'),
			(SELECT to_jsonb(upcoming) - '{cutoff,overdue}'::text[] FROM upcoming),
			COALESCE(
				jsonb_agg(to_jsonb(owned_tasks) - '{cutoff,overdue}'::text[] ORDER BY cutoff DESC, id DESC)
					FILTER (WHERE status <> 'completed' AND overdue),
				'[]'::jsonb
			)
		FROM owned_tasks;
	`

	var status Status
	var nearest, overdue []byte
	err := db.QueryRowContext(ctx, query, userID, zone).Scan(
		&status.TotalSubjects, &status.TotalTasks, &status.TotalCompletedTasks,
		&status.TotalOngoingTasks, &status.TotalNotCompleted, &nearest, &overdue,
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
