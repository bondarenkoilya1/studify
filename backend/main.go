package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"
)

type subject struct {
	ID       int       `json:"id"`
	Lecturer string    `json:"lecturer"`
	ExamDate time.Time `json:"exam_date"`
}

var subjects []subject
var nextID = 1

func main() {
	http.HandleFunc("/subjects", subjectsHandler)
	http.HandleFunc("/subjects/", getSubject)
	log.Fatal(http.ListenAndServe(":8080", nil))
}

func subjectsHandler(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		getSubjects(w, r)
	case http.MethodPost:
		addSubjects(w, r)
	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

func getSubject(w http.ResponseWriter, r *http.Request) {
	idStr := strings.TrimPrefix(r.URL.Path, "/subjects/")
	if idStr == "" {
		http.Error(w, "Missing subject id", http.StatusBadRequest)
		return
	}

	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid subject id", http.StatusBadRequest)
		return
	}

	var selectedSubj subject
	found := false
	for _, subj := range subjects {
		if subj.ID == id {
			selectedSubj = subj
			found = true
			break
		}
	}

	if !found {
		http.Error(w, "Subject was not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(selectedSubj); err != nil {
		http.Error(w, "Failed to encode response", http.StatusInternalServerError)
		return
	}
}

func getSubjects(w http.ResponseWriter, r *http.Request) {
	for _, subj := range subjects {
		_, err := fmt.Fprintf(w, "ID: %d | Lecturer %s will take the exam at %s\n", subj.ID, subj.Lecturer, subj.ExamDate.Format("02.01.2006 15:04"))
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
	}
}

func addSubjects(w http.ResponseWriter, r *http.Request) {
	if r.Header.Get("Content-Type") != "application/json" {
		http.Error(w, "You need to use the following header -> Content-Type: application/json", http.StatusUnsupportedMediaType)
		return
	}

	var newSubjects []subject

	err := json.NewDecoder(r.Body).Decode(&newSubjects)
	if err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	for i := range newSubjects {
		newSubjects[i].ID = nextID
		nextID++
	}

	subjects = append(subjects, newSubjects...)

	fmt.Println(subjects)
	w.WriteHeader(http.StatusCreated)
}
