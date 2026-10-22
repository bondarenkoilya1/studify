package task

import (
	"database/sql"
	"errors"
	"fmt"
)

var ErrNoFieldsToUpdate = errors.New("no fields to update")

type Service struct {
	db *sql.DB
}

func NewService(db *sql.DB) *Service {
	return &Service{db: db}
}

func (s *Service) getTask(id, userID int64) (*Task, error) {
	task, err := GetTaskByID(s.db, id, userID)
	if err != nil {
		return nil, fmt.Errorf("get task %d: %w", id, err)
	}

	return task, nil
}

func (s *Service) getUserTasks(userID int64) ([]Task, error) {
	tasks, err := GetTasksByUserID(s.db, userID)
	if err != nil {
		return nil, fmt.Errorf("get tasks of user %d: %w", userID, err)
	}

	if tasks == nil {
		tasks = []Task{}
	}

	return tasks, nil
}

func (s *Service) getSubjectsTasks(subjectID, userID int64) ([]Task, error) {
	tasks, err := GetTasksBySubjectID(s.db, userID, subjectID)
	if err != nil {
		return nil, fmt.Errorf("get tasks of subject %d: %w", subjectID, err)
	}

	if tasks == nil {
		tasks = []Task{}
	}

	return tasks, nil
}

func (s *Service) addTask(userID int64, t *Task) (*Task, error) {
	task, err := InsertTask(
		s.db, userID, t.Name,
		t.Type, t.Description,
		t.EstimatedTime, t.ScheduledAt,
		t.Deadline, t.Status, t.Difficulty,
		t.Priority, t.SubjectID,
	)
	if err != nil {
		return nil, fmt.Errorf("insert task: %w", err)
	}

	return task, nil
}

func (s *Service) replaceTask(userID, id int64, t *Task) (*Task, error) {
	task, err := UpdateTask(
		s.db, userID, id, t.Name,
		t.Type, t.Description,
		t.EstimatedTime, t.ScheduledAt,
		t.Deadline, t.Status, t.Difficulty,
		t.Priority, t.SubjectID,
	)
	if err != nil {
		return nil, fmt.Errorf("replace task %d: %w", id, err)
	}

	return task, nil
}

func (s *Service) updateTask(userID, id int64, req *updateTaskRequest) (*Task, error) {
	if req.isEmpty() {
		return nil, ErrNoFieldsToUpdate
	}

	task, err := GetTaskByID(s.db, id, userID)
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
	if req.EstimatedTime != nil {
		task.EstimatedTime = req.EstimatedTime
	}
	if req.ScheduledAt != nil {
		task.ScheduledAt = req.ScheduledAt
	}
	if req.Deadline != nil {
		task.Deadline = req.Deadline
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

	updated, err := UpdateTask(
		s.db, userID, id, task.Name,
		task.Type, task.Description,
		task.EstimatedTime, task.ScheduledAt,
		task.Deadline, task.Status, task.Difficulty,
		task.Priority, task.SubjectID,
	)
	if err != nil {
		return nil, fmt.Errorf("save updated task %d: %w", id, err)
	}

	return updated, nil
}

func (s *Service) deleteUserTasks(userID int64) error {
	if err := DeleteTasksByUserID(s.db, userID); err != nil {
		return fmt.Errorf("delete tasks of user %d: %w", userID, err)
	}

	return nil
}

func (s *Service) deleteTask(userID, id int64) error {
	if err := DeleteTaskByID(s.db, userID, id); err != nil {
		return fmt.Errorf("delete task %d: %w", id, err)
	}

	return nil
}

func (r *updateTaskRequest) isEmpty() bool {
	return r.Name == nil &&
		r.Description == nil &&
		r.SubjectID == nil &&
		r.Type == nil &&
		r.EstimatedTime == nil &&
		r.ScheduledAt == nil &&
		r.Deadline == nil &&
		r.Status == nil &&
		r.Difficulty == nil &&
		r.Priority == nil
}
