package task

import (
	"errors"
	"fmt"
	"math"
	"slices"
	"strings"
	"unicode/utf8"
)

func validateTask(task *Task) error {
	return validateTaskChanges(&updateTaskRequest{
		SubjectID: &task.SubjectID, Name: &task.Name, Description: &task.Description,
		EstimatedTime: task.EstimatedTime, Type: &task.Type, Status: &task.Status,
		Difficulty: &task.Difficulty, Priority: &task.Priority,
	})
}

func validateTaskChanges(req *updateTaskRequest) error {
	if req.SubjectID != nil && *req.SubjectID <= 0 {
		return errors.New("subject_id must be positive")
	}
	if req.Name != nil && (strings.TrimSpace(*req.Name) == "" ||
		utf8.RuneCountInString(*req.Name) > 200 || strings.ContainsRune(*req.Name, 0)) {
		return errors.New("task name must contain 1 to 200 characters and no NUL characters")
	}
	if req.Description != nil && (utf8.RuneCountInString(*req.Description) > 2000 ||
		strings.ContainsRune(*req.Description, 0)) {
		return errors.New("task description must contain at most 2000 characters and no NUL characters")
	}
	if req.EstimatedTime != nil && (*req.EstimatedTime <= 0 || *req.EstimatedTime > math.MaxInt32) {
		return errors.New("estimated_time must be a positive 32-bit integer")
	}

	levels := []string{"low", "medium", "high"}
	for _, field := range []struct {
		name    string
		value   *string
		allowed []string
	}{
		{"type", req.Type, []string{"exam", "credit", "coursework", "project", "other"}},
		{"status", req.Status, []string{"not_completed", "ongoing", "completed"}},
		{"difficulty", req.Difficulty, levels},
		{"priority", req.Priority, levels},
	} {
		if field.value != nil && !slices.Contains(field.allowed, *field.value) {
			return fmt.Errorf("invalid task %s", field.name)
		}
	}
	return nil
}
