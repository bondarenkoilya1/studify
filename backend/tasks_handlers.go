package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strings"

	"studify/models"
)

func AddTasks(w http.ResponseWriter, r *http.Request) {
	if !strings.Contains(r.Header.Get("Content-Type"), "application/json") {
		http.Error(w, "You need to use the following header -> Content-Type: application/json", http.StatusUnsupportedMediaType)
		return
	}

	var newTasks []models.Task

	if err := json.NewDecoder(r.Body).Decode(&newTasks); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	for i := range newTasks {
		newTasks[i].ID = models.NextTaskID
		models.NextTaskID++
	}

	models.Tasks = append(models.Tasks, newTasks...)
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)

	if err := json.NewEncoder(w).Encode(newTasks); err != nil {
		log.Println("Tasks were created but cannot be encoded as JSON: ", err)
		return
	}
}

func GetTasks(w http.ResponseWriter, _ *http.Request) {
	response, err := json.Marshal(models.Tasks)
	if err != nil {
		http.Error(w, "Cannot encode tasks as JSON", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if _, err = w.Write(response); err != nil {
		log.Println("Cannot write response: ", err)
	}
}

func GetTask(w http.ResponseWriter, r *http.Request) {
	id, err := GetID(r)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	for _, task := range models.Tasks {
		if task.ID == id {
			w.Header().Set("Content-Type", "application/json")

			if err = json.NewEncoder(w).Encode(task); err != nil {
				http.Error(w, "Cannot encode task as JSON", http.StatusInternalServerError)
				return
			}

			return
		}
	}

	http.Error(w, "Task with such ID was not found", http.StatusNotFound)
	return
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
