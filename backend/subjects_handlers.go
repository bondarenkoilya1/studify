package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strings"
	"time"
)

type Subject struct {
	ID       int       `json:"id"`
	Name     string    `json:"name"`
	Lecturer string    `json:"lecturer"`
	ExamDate time.Time `json:"exam_date"`
}

var Subjects = []Subject{}
var nextSubjectID = 1

func GetSubject(w http.ResponseWriter, r *http.Request) {
	id, err := GetID(r)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	var selectedSubj Subject
	found := false
	for _, subj := range Subjects {
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

func GetSubjects(w http.ResponseWriter, _ *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(Subjects); err != nil {
		http.Error(w, "Cannot parse subjects as JSON", http.StatusInternalServerError)
		return
	}
}

func AddSubjects(w http.ResponseWriter, r *http.Request) {
	if !strings.Contains(r.Header.Get("Content-Type"), "application/json") {
		http.Error(w, "You need to use the following header -> Content-Type: application/json", http.StatusUnsupportedMediaType)
		return
	}

	var newSubjects []Subject

	err := json.NewDecoder(r.Body).Decode(&newSubjects)
	if err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	for i := range newSubjects {
		newSubjects[i].ID = nextSubjectID
		nextSubjectID++
	}

	Subjects = append(Subjects, newSubjects...)
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)

	if err = json.NewEncoder(w).Encode(&newSubjects); err != nil {
		http.Error(w, "Cannot parse subjects as JSON", http.StatusInternalServerError)
		return
	}
}

func ReplaceSubject(w http.ResponseWriter, r *http.Request) {
	if !strings.Contains(r.Header.Get("Content-Type"), "application/json") {
		http.Error(w, "You need to use the following header -> Content-Type: application/json", http.StatusUnsupportedMediaType)
		return
	}

	id, err := GetID(r)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	var newSubject Subject
	if err = json.NewDecoder(r.Body).Decode(&newSubject); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	for i, subj := range Subjects {
		if subj.ID == id {
			newSubject.ID = id
			Subjects[i] = newSubject

			w.Header().Set("Content-Type", "application/json")
			if err = json.NewEncoder(w).Encode(Subjects[i]); err != nil {
				log.Printf("Element was changed but cannot be returned as JSON because of encoding error: %v", err)
			}
			return
		}
	}

	http.Error(w, fmt.Sprintf("No such element with ID: %d", id), http.StatusNotFound)
}

func DeleteSubjects(w http.ResponseWriter, _ *http.Request) {
	Subjects = []Subject{}
	w.WriteHeader(http.StatusNoContent)
}

func DeleteSubject(w http.ResponseWriter, r *http.Request) {
	id, err := GetID(r)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	for i, subj := range Subjects {
		if subj.ID == id {
			Subjects = append(Subjects[:i], Subjects[i+1:]...)
			w.WriteHeader(http.StatusNoContent)
			return
		}
	}

	http.Error(w, "No such element with this ID", http.StatusNotFound)
}
