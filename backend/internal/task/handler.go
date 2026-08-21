package task

import (
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"

	"studify/internal/httpx"
)

func (h *Handler) GetTask(w http.ResponseWriter, r *http.Request) {
	userID, err := httpx.GetUserID(r)
	if err != nil {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	id, err := httpx.GetID(r)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	task, err := GetTaskByID(h.DB, id, userID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			http.Error(w, "Task was not found", http.StatusNotFound)
			return
		}

		log.Printf("failed to get task: %v", err)
		http.Error(w, "Failed to get task", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")

	if err := json.NewEncoder(w).Encode(task); err != nil {
		log.Printf("failed to encode task: %v", err)
	}
}

func (h *Handler) GetUserTasks(w http.ResponseWriter, r *http.Request) {
	userID, err := httpx.GetUserID(r)
	if err != nil {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	tasks, err := GetTasksByUserID(h.DB, userID)
	if err != nil {
		log.Printf("failed to get tasks: %v", err)
		http.Error(w, "Failed to get tasks", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")

	if err := json.NewEncoder(w).Encode(tasks); err != nil {
		log.Printf("failed to encode tasks: %v", err)
	}
}

func (h *Handler) AddTask(w http.ResponseWriter, r *http.Request) {
	userID, err := httpx.GetUserID(r)
	if err != nil {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	var newTask Task

	if err := json.NewDecoder(r.Body).Decode(&newTask); err != nil {
		log.Printf("failed to decode task body: %v", err)
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	log.Printf("userID=%d, subjectID=%d", userID, newTask.SubjectID)
	task, err := InsertTask(
		h.DB,
		userID,
		newTask.Name,
		newTask.Type,
		newTask.Description,
		newTask.EstimatedTime,
		newTask.ScheduledAt,
		newTask.Deadline,
		newTask.Status,
		newTask.Difficulty,
		newTask.Priority,
		newTask.SubjectID,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			http.Error(w, "Subject not found", http.StatusNotFound)
			return
		}

		log.Printf("failed to insert task: %v", err)
		http.Error(w, "Failed to insert task", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)

	if err := json.NewEncoder(w).Encode(task); err != nil {
		log.Printf("failed to encode task response: %v", err)
	}
}

func (h *Handler) ReplaceTask(w http.ResponseWriter, r *http.Request) {
	userID, err := httpx.GetUserID(r)
	if err != nil {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	id, err := httpx.GetID(r)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	var newTask Task

	if err := json.NewDecoder(r.Body).Decode(&newTask); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	task, err := UpdateTask(
		h.DB,
		userID,
		id,
		newTask.Name,
		newTask.Type,
		newTask.Description,
		newTask.EstimatedTime,
		newTask.ScheduledAt,
		newTask.Deadline,
		newTask.Status,
		newTask.Difficulty,
		newTask.Priority,
		newTask.SubjectID,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			http.Error(
				w,
				fmt.Sprintf("No task with ID: %d", id),
				http.StatusNotFound,
			)
			return
		}

		log.Printf("failed to replace task: %v", err)
		http.Error(w, "Failed to replace task", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")

	if err := json.NewEncoder(w).Encode(task); err != nil {
		log.Printf("failed to encode replaced task: %v", err)
	}
}

func (h *Handler) UpdateTask(w http.ResponseWriter, r *http.Request) {
	userID, err := httpx.GetUserID(r)
	if err != nil {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	var req UpdateTaskRequest

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	if req.Name == nil &&
		req.Description == nil &&
		req.SubjectID == nil &&
		req.Type == nil &&
		req.EstimatedTime == nil &&
		req.ScheduledAt == nil &&
		req.Deadline == nil &&
		req.Status == nil &&
		req.Difficulty == nil &&
		req.Priority == nil {
		http.Error(w, "No fields to update", http.StatusBadRequest)
		return
	}

	id, err := httpx.GetID(r)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	task, err := GetTaskByID(h.DB, id, userID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			http.Error(w, "Task not found", http.StatusNotFound)
			return
		}

		log.Printf("failed to get task: %v", err)
		http.Error(w, "Failed to get task", http.StatusInternalServerError)
		return
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

	updatedTask, err := UpdateTask(
		h.DB,
		userID,
		id,
		task.Name,
		task.Type,
		task.Description,
		task.EstimatedTime,
		task.ScheduledAt,
		task.Deadline,
		task.Status,
		task.Difficulty,
		task.Priority,
		task.SubjectID,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			http.Error(w, "Task not found", http.StatusNotFound)
			return
		}

		log.Printf("failed to update task: %v", err)
		http.Error(w, "Failed to update task", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")

	if err := json.NewEncoder(w).Encode(updatedTask); err != nil {
		log.Printf("failed to encode task: %v", err)
	}
}

func (h *Handler) DeleteTasks(w http.ResponseWriter, r *http.Request) {
	userID, err := httpx.GetUserID(r)
	if err != nil {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	if err := DeleteTasksByUserID(h.DB, userID); err != nil {
		log.Printf("failed to delete tasks: %v", err)
		http.Error(w, "Failed to delete tasks", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (h *Handler) DeleteTask(w http.ResponseWriter, r *http.Request) {
	userID, err := httpx.GetUserID(r)
	if err != nil {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	id, err := httpx.GetID(r)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if err := DeleteTaskByID(h.DB, userID, id); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			http.Error(
				w,
				fmt.Sprintf("No task with ID: %d", id),
				http.StatusNotFound,
			)
			return
		}

		log.Printf("failed to delete task: %v", err)
		http.Error(w, "Failed to delete task", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
