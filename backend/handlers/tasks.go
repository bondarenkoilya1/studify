package handlers

import (
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"strings"
	"studify/database"
	"studify/models"
)

func (h *Handler) GetTask(w http.ResponseWriter, r *http.Request) {
	id, err := GetID(r)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	task, err := database.GetTaskByID(h.DB, id)
	if err != nil {
		http.Error(w, "Task was not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err = json.NewEncoder(w).Encode(task); err != nil {
		http.Error(w, "Failed to encode response", http.StatusInternalServerError)
		return
	}
}

func (h *Handler) GetTasks(w http.ResponseWriter, _ *http.Request) {
	tasks, err := database.GetTasks(h.DB)
	if err != nil {
		http.Error(w, "Failed to get tasks", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err = json.NewEncoder(w).Encode(tasks); err != nil {
		log.Println("Failed to encode response: ", err)
	}
}

func (h *Handler) AddTasks(w http.ResponseWriter, r *http.Request) {
	if !strings.Contains(r.Header.Get("Content-Type"), "application/json") {
		http.Error(w, "You need to use the following header -> Content-Type: application/json", http.StatusUnsupportedMediaType)
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
		task, err := database.InsertTask(h.DB, t.Name, t.DueDate, t.Status, t.SubjectID)
		if err != nil {
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
	if !strings.Contains(r.Header.Get("Content-Type"), "application/json") {
		http.Error(w, "You need to use the following header -> Content-Type: application/json", http.StatusUnsupportedMediaType)
		return
	}

	id, err := GetID(r)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	var newTask models.Task
	if err = json.NewDecoder(r.Body).Decode(&newTask); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	task, err := database.UpdateTask(h.DB, id, newTask.Name, newTask.DueDate, newTask.Status, newTask.SubjectID)
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

func (h *Handler) DeleteTasks(w http.ResponseWriter, _ *http.Request) {
	err := database.DeleteTasks(h.DB)
	if err != nil {
		http.Error(w, "Failed to delete tasks", http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *Handler) DeleteTask(w http.ResponseWriter, r *http.Request) {
	id, err := GetID(r)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	err = database.DeleteTask(h.DB, id)
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
