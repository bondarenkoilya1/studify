package handlers

import (
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"studify/internal/database"
	"studify/internal/httpx"
	"studify/internal/models"
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

	task, err := database.GetTaskByID(h.DB, id, userID)
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
	if err = json.NewEncoder(w).Encode(task); err != nil {
		http.Error(w, "Failed to encode response", http.StatusInternalServerError)
		return
	}
}

func (h *Handler) GetTasks(w http.ResponseWriter, r *http.Request) {
	userID, err := httpx.GetUserID(r)
	if err != nil {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	tasks, err := database.GetTasksByUserID(h.DB, userID)
	if err != nil {
		log.Printf("failed to get tasks: %v", err)
		http.Error(w, "Failed to get tasks", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err = json.NewEncoder(w).Encode(tasks); err != nil {
		log.Println("Failed to encode response: ", err)
	}
}

func (h *Handler) AddTasks(w http.ResponseWriter, r *http.Request) {
	userID, err := httpx.GetUserID(r)
	if err != nil {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	var newTasks []models.Task

	if err := json.NewDecoder(r.Body).Decode(&newTasks); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	if len(newTasks) == 0 {
		http.Error(w, "Tasks list cannot be empty", http.StatusBadRequest)
		return
	}

	createdSubjects := make([]models.Task, 0, len(newTasks))
	for _, t := range newTasks {
		task, err := database.InsertTask(h.DB, userID, t.Name, t.Description, t.Deadline, t.Status, t.SubjectID)
		if err != nil {
			if errors.Is(err, sql.ErrNoRows) {
				http.Error(w, "Subject not found", http.StatusNotFound)
				return
			}

			log.Printf("failed to insert task: %v", err)
			http.Error(w, "Failed to insert tasks", http.StatusInternalServerError)
			return
		}

		createdSubjects = append(createdSubjects, *task)
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)

	if err := json.NewEncoder(w).Encode(createdSubjects); err != nil {
		log.Println("Failed to encode response: ", err)
		return
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

	var newTask models.Task
	if err = json.NewDecoder(r.Body).Decode(&newTask); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	task, err := database.UpdateTask(h.DB, userID, id, newTask.Name, newTask.Description, newTask.Deadline, newTask.Status, newTask.SubjectID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			http.Error(w, fmt.Sprintf("No such element with ID: %d", id), http.StatusNotFound)
			return
		}

		http.Error(w, "Failed to replace task", http.StatusInternalServerError)
		return
	}

	newTask.ID = id
	w.Header().Set("Content-Type", "application/json")
	if err = json.NewEncoder(w).Encode(task); err != nil {
		log.Printf("Element was changed. Failed to return as JSON because of encoding error: %v", err)
	}
}

func (h *Handler) UpdateTask(w http.ResponseWriter, r *http.Request) {
	userID, err := httpx.GetUserID(r)
	if err != nil {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	var req *models.UpdateTaskRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	if req.Name == nil && req.Description == nil && req.Deadline == nil && req.Status == nil && req.SubjectID == nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	id, err := httpx.GetID(r)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	task, err := database.GetTaskByID(h.DB, id, userID)
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

	if req.Status != nil {
		task.Status = *req.Status
	}

	if req.SubjectID != nil {
		task.SubjectID = *req.SubjectID
	}

	if req.Deadline != nil {
		task.Deadline = req.Deadline
	}

	updatedTask, err := database.UpdateTask(h.DB, userID, id, task.Name, task.Description, task.Deadline, task.Status, task.SubjectID)
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
	if err = json.NewEncoder(w).Encode(updatedTask); err != nil {
		http.Error(w, "Failed to encode task as JSON", http.StatusInternalServerError)
		return
	}
}

func (h *Handler) DeleteTasks(w http.ResponseWriter, r *http.Request) {
	userID, err := httpx.GetUserID(r)
	if err != nil {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	err = database.DeleteTasksByUserID(h.DB, userID)
	if err != nil {
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

	err = database.DeleteTaskByID(h.DB, userID, id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			http.Error(w, fmt.Sprintf("No such element with ID: %d", id), http.StatusNotFound)
			return
		}

		http.Error(w, "Failed to delete task", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
