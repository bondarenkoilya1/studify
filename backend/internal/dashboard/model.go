package dashboard

import (
	"database/sql"
	"studify/internal/task"
)

type Status struct {
	TotalSubjects       int64       `json:"total_subjects"`
	TotalTasks          int64       `json:"total_tasks"`
	TotalCompletedTasks int64       `json:"total_completed_tasks"`
	TotalOngoingTasks   int64       `json:"total_ongoing_tasks"`
	TotalNotCompleted   int64       `json:"total_not_completed_tasks"`
	CompletionPercent   float64     `json:"completion_percent"`
	NearestDeadlineTask *task.Task  `json:"nearest_deadline_task"`
	OverdueTasks        []task.Task `json:"overdue_tasks"`
}

type Handler struct {
	DB *sql.DB
}
