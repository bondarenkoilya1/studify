package main

import (
	"encoding/json"
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

func SubjectHandler(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		getSubject(w, r)
	case http.MethodDelete:
		deleteSubject(w, r)
	//case http.MethodPatch:
	//	editSubject(w, r)
	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

func SubjectsHandler(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		getSubjects(w, r)
	case http.MethodPost:
		addSubjects(w, r)
	case http.MethodDelete:
		deleteSubjects(w, r)
	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

func getSubject(w http.ResponseWriter, r *http.Request) {
	id, err := GetID(r.URL.Path, "/subjects/")
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

func getSubjects(w http.ResponseWriter, _ *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(Subjects); err != nil {
		http.Error(w, "Cannot parse subjects as JSON", http.StatusInternalServerError)
		return
	}
}

func addSubjects(w http.ResponseWriter, r *http.Request) {
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

//
//func editSubject(w http.ResponseWriter, r *http.Request) {
//id, err := GetID(r.URL.Path, "/subjects/")
//if err != nil {
//http.Error(w, err.Error(), http.StatusBadRequest)
//return
//}
//
//
//
//	for _, subj := range Subjects {
//		if subj.ID == id {
//			subj =
//		}
//	}
//
//	w.Header().Set("Content-Type", "application/json")
//
//}

func deleteSubjects(w http.ResponseWriter, _ *http.Request) {
	Subjects = []Subject{}
	w.WriteHeader(http.StatusNoContent)
}

func deleteSubject(w http.ResponseWriter, r *http.Request) {
	id, err := GetID(r.URL.Path, "/subjects/")
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
