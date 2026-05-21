package main

import (
	"encoding/json"
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

func TasksHandler(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		getTasks(w, r)
	case http.MethodPost:
		addTasks(w, r)
	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

func addTasks(w http.ResponseWriter, r *http.Request) {
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

func getTasks(w http.ResponseWriter, _ *http.Request) {
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
