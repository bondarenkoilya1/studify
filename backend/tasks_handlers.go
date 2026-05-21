package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strings"
	"time"
)

type Task struct {
	ID      int       `json:"id"`
	Name    string    `json:"name"`
	Subject string    `json:"subject"`
	DueDate time.Time `json:"due_date"`
	Status  string    `json:"status"`
}

var Tasks = []Task{}
var nextTaskID = 1

func AddTasks(w http.ResponseWriter, r *http.Request) {
	if !strings.Contains(r.Header.Get("Content-Type"), "application/json") {
		http.Error(w, "You need to use the following header -> Content-Type: application/json", http.StatusUnsupportedMediaType)
		return
	}

	var newTasks []Task

	if err := json.NewDecoder(r.Body).Decode(&newTasks); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	for i := range newTasks {
		newTasks[i].ID = nextTaskID
		nextTaskID++
	}

	Tasks = append(Tasks, newTasks...)
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)

	if err := json.NewEncoder(w).Encode(newTasks); err != nil {
		log.Println("Tasks were created but cannot be encoded as JSON: ", err)
		return
	}
}

func GetTasks(w http.ResponseWriter, _ *http.Request) {
	response, err := json.Marshal(Tasks)
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
	id, err := GetID(r.URL.Path, "/tasks/")
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	for _, task := range Tasks {
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
	Tasks = []Task{}
	w.WriteHeader(http.StatusNoContent)
}

func DeleteTask(w http.ResponseWriter, r *http.Request) {
	id, err := GetID(r.URL.Path, "/tasks/")
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	for i, task := range Tasks {
		if task.ID == id {
			Tasks = append(Tasks[:i], Tasks[i+1:]...)
			w.WriteHeader(http.StatusNoContent)
			return
		}
	}

	http.Error(w, fmt.Sprintf("No such element with ID: %d", id), http.StatusNotFound)
}

func ReplaceTask(w http.ResponseWriter, r *http.Request) {
	id, err := GetID(r.URL.Path, "/tasks/")
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	var newTask Task
	if err = json.NewDecoder(r.Body).Decode(&newTask); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	for i, task := range Tasks {
		if task.ID == id {
			newTask.ID = id
			Tasks[i] = newTask

			w.Header().Set("Content-Type", "application/json")
			if err = json.NewEncoder(w).Encode(Tasks[i]); err != nil {
				log.Printf("Element was changed but cannot be returned as JSON because of encoding error: %v", err)
			}
			return
		}
	}

	http.Error(w, fmt.Sprintf("No such element with ID: %d", id), http.StatusNotFound)
}
