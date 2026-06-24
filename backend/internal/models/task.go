package models

import "time"

type Task struct {
	ID          int64      `json:"id"`
	Name        string     `json:"name"`
	Description string     `json:"description"`
	SubjectID   int64      `json:"subject_id"`
	Deadline    *time.Time `json:"deadline"`
	Status      string     `json:"status"`
}

type UpdateTaskRequest struct {
	Name        *string    `json:"name"`
	Description *string    `json:"description"`
	SubjectID   *int64     `json:"subject_id"`
	Deadline    *time.Time `json:"deadline"`
	Status      *string    `json:"status"`
}
