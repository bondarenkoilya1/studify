package task

import (
	"time"
)

type Handler struct {
	Service *Service
}

type Task struct {
	ID            int64      `json:"id"`
	SubjectID     int64      `json:"subject_id"`
	Name          string     `json:"name"`
	Type          string     `json:"type"`
	Description   string     `json:"description"`
	EstimatedTime *int       `json:"estimated_time"`
	ScheduledAt   *time.Time `json:"scheduled_at"`
	Deadline      *time.Time `json:"deadline"`
	Status        string     `json:"status"`
	Difficulty    string     `json:"difficulty"`
	Priority      string     `json:"priority"`
	CreatedAt     time.Time  `json:"created_at"`
	UpdatedAt     time.Time  `json:"updated_at"`
}

type updateTaskRequest struct {
	Name          *string    `json:"name"`
	Description   *string    `json:"description"`
	SubjectID     *int64     `json:"subject_id"`
	Type          *string    `json:"type"`
	EstimatedTime *int       `json:"estimated_time"`
	ScheduledAt   *time.Time `json:"scheduled_at"`
	Deadline      *time.Time `json:"deadline"`
	Status        *string    `json:"status"`
	Difficulty    *string    `json:"difficulty"`
	Priority      *string    `json:"priority"`
}
