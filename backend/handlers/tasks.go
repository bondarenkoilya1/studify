package handlers

import (
	"encoding/json"
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
		http.Error(w, "Subject was not found", http.StatusNotFound)
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
		http.Error(w, "Subjects list cannot be empty", http.StatusBadRequest)
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

func DeleteTasks(w http.ResponseWriter, _ *http.Request) {
	models.Tasks = []models.Task{}
	w.WriteHeader(http.StatusNoContent)
}

func DeleteTask(w http.ResponseWriter, r *http.Request) {
	id, err := GetID(r)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	for i, task := range models.Tasks {
		if task.ID == id {
			models.Tasks = append(models.Tasks[:i], models.Tasks[i+1:]...)
			w.WriteHeader(http.StatusNoContent)
			return
		}
	}

	http.Error(w, fmt.Sprintf("No such element with ID: %d", id), http.StatusNotFound)
}

func ReplaceTask(w http.ResponseWriter, r *http.Request) {
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

	for i, task := range models.Tasks {
		if task.ID == id {
			newTask.ID = id
			models.Tasks[i] = newTask

			w.Header().Set("Content-Type", "application/json")
			if err = json.NewEncoder(w).Encode(models.Tasks[i]); err != nil {
				log.Printf("Element was changed but cannot be returned as JSON because of encoding error: %v", err)
			}
			return
		}
	}

	http.Error(w, fmt.Sprintf("No such element with ID: %d", id), http.StatusNotFound)
}
