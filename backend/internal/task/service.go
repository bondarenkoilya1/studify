package task

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"time"
)

var ErrNoFieldsToUpdate = errors.New("no fields to update")

type Service struct {
	db *sql.DB
}

func NewService(db *sql.DB) *Service {
	return &Service{db: db}
}

func (s *Service) getTask(ctx context.Context, id, userID int64) (*Task, error) {
	task, err := GetTaskByID(ctx, s.db, id, userID)
	if err != nil {
		return nil, fmt.Errorf("get task %d: %w", id, err)
	}

	return task, nil
}

func (s *Service) getUserTasks(ctx context.Context, userID int64) ([]Task, error) {
	tasks, err := GetTasksByUserID(ctx, s.db, userID)
	if err != nil {
		return nil, fmt.Errorf("get tasks of user %d: %w", userID, err)
	}

	if tasks == nil {
		tasks = []Task{}
	}

	return tasks, nil
}

func (s *Service) getSubjectsTasks(ctx context.Context, subjectID, userID int64) ([]Task, error) {
	tasks, err := GetTasksBySubjectID(ctx, s.db, userID, subjectID)
	if err != nil {
		return nil, fmt.Errorf("get tasks of subject %d: %w", subjectID, err)
	}

	if tasks == nil {
		tasks = []Task{}
	}

	return tasks, nil
}

func (s *Service) addTask(ctx context.Context, userID int64, t *Task) (*Task, error) {
	t.normalizeDates()
	task, err := InsertTask(ctx, s.db, userID, t)
	if err != nil {
		return nil, fmt.Errorf("insert task: %w", err)
	}

	return task, nil
}

func (s *Service) replaceTask(ctx context.Context, userID, id int64, t *Task) (*Task, error) {
	t.normalizeDates()
	task, err := UpdateTask(ctx, s.db, userID, id, t)
	if err != nil {
		return nil, fmt.Errorf("replace task %d: %w", id, err)
	}

	return task, nil
}

func (s *Service) updateTask(ctx context.Context, userID, id int64, req *updateTaskRequest) (*Task, error) {
	if req.isEmpty() {
		return nil, ErrNoFieldsToUpdate
	}

	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return nil, fmt.Errorf("begin task update: %w", err)
	}
	defer func() { _ = tx.Rollback() }()

	task, err := getTaskByID(ctx, tx, id, userID, true)
	if err != nil {
		return nil, fmt.Errorf("load task %d for update: %w", id, err)
	}

	if req.Name != nil {
		task.Name = *req.Name
	}
	if req.Description != nil {
		task.Description = *req.Description
	}
	if req.SubjectID != nil {
		task.SubjectID = *req.SubjectID
	}
	if req.Type != nil {
		task.Type = *req.Type
	}
	if req.EstimatedTimeSet || req.EstimatedTime != nil {
		task.EstimatedTime = req.EstimatedTime
	}
	if req.ScheduleSet || req.ScheduledAt != nil || req.ScheduledDate != nil {
		task.ScheduledAt = req.ScheduledAt
		task.ScheduledDate = req.ScheduledDate
	}
	if req.DeadlineSet || req.Deadline != nil || req.DeadlineDate != nil {
		task.Deadline = req.Deadline
		task.DeadlineDate = req.DeadlineDate
	}
	if req.Status != nil {
		task.Status = *req.Status
	}
	if req.Difficulty != nil {
		task.Difficulty = *req.Difficulty
	}
	if req.Priority != nil {
		task.Priority = *req.Priority
	}

	task.normalizeDates()
	updated, err := UpdateTask(ctx, tx, userID, id, task)
	if err != nil {
		return nil, fmt.Errorf("save updated task %d: %w", id, err)
	}

	if err := tx.Commit(); err != nil {
		return nil, fmt.Errorf("commit task update: %w", err)
	}

	return updated, nil
}

func (t *Task) normalizeDates() {
	if t.ScheduledDate != nil {
		t.ScheduledAt = nil
	}
	if t.DeadlineDate != nil && t.Deadline == nil {
		day, _ := time.Parse(time.DateOnly, string(*t.DeadlineDate))
		cutoff := day.AddDate(0, 0, 1).Add(-time.Microsecond)
		t.Deadline = &cutoff
	}
}

func (s *Service) deleteUserTasks(ctx context.Context, userID int64) error {
	if err := DeleteTasksByUserID(ctx, s.db, userID); err != nil {
		return fmt.Errorf("delete tasks of user %d: %w", userID, err)
	}

	return nil
}

func (s *Service) deleteTask(ctx context.Context, userID, id int64) error {
	if err := DeleteTaskByID(ctx, s.db, userID, id); err != nil {
		return fmt.Errorf("delete task %d: %w", id, err)
	}

	return nil
}

func (r *updateTaskRequest) isEmpty() bool {
	return r.Name == nil &&
		r.Description == nil &&
		r.SubjectID == nil &&
		r.Type == nil &&
		!r.EstimatedTimeSet && r.EstimatedTime == nil &&
		!r.ScheduleSet && r.ScheduledAt == nil &&
		!r.DeadlineSet && r.Deadline == nil &&
		r.ScheduledDate == nil &&
		r.DeadlineDate == nil &&
		r.Status == nil &&
		r.Difficulty == nil &&
		r.Priority == nil
}
