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
	http.HandleFunc("/subjects/", subjectHandler)
	log.Fatal(http.ListenAndServe(":8080", nil))
}

func subjectsHandler(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		getSubjects(w)
	case http.MethodPost:
		addSubjects(w, r)
	case http.MethodDelete:
		deleteSubjects(w)
	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

func subjectHandler(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		getSubject(w, r)
	case http.MethodDelete:
		deleteSubject(w, r)
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

func getSubjects(w http.ResponseWriter) {
	if subjects == nil {
		subjects = []subject{}
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(subjects); err != nil {
		http.Error(w, "Cannot parse subjects as JSON", http.StatusInternalServerError)
		return
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

func deleteSubjects(w http.ResponseWriter) {
	subjects = nil
	w.WriteHeader(http.StatusNoContent)
}

func deleteSubject(w http.ResponseWriter, r *http.Request) {
	idStr := strings.TrimPrefix(r.URL.Path, "/subjects/")

	if idStr == "" {
		http.Error(w, "Missing subject ID", http.StatusBadRequest)
		return
	}

	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "ID must be an integer", http.StatusBadRequest)
		return
	}

	for i, subj := range subjects {
		if subj.ID == id {
			subjects = append(subjects[:i], subjects[i+1:]...)
			w.WriteHeader(http.StatusNoContent)
			return
		}
	}

	http.Error(w, "No such element with this ID", http.StatusNotFound)
}
