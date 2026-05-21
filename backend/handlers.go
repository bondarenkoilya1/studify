package main

import (
	"encoding/json"
	"net/http"
	"strconv"
	"strings"
)

func SubjectHandler(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		getSubject(w, r)
	case http.MethodDelete:
		deleteSubject(w, r)
	}
}

func SubjectsHandler(w http.ResponseWriter, r *http.Request) {
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

func getSubjects(w http.ResponseWriter) {
	if Subjects == nil {
		Subjects = []Subject{}
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(Subjects); err != nil {
		http.Error(w, "Cannot parse subjects as JSON", http.StatusInternalServerError)
		return
	}
}

func addSubjects(w http.ResponseWriter, r *http.Request) {
	if r.Header.Get("Content-Type") != "application/json" {
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
		newSubjects[i].ID = NextID
		NextID++
	}

	Subjects = append(Subjects, newSubjects...)

	w.WriteHeader(http.StatusCreated)

	if err = json.NewEncoder(w).Encode(&newSubjects); err != nil {
		http.Error(w, "Cannot parse subjects as JSON", http.StatusInternalServerError)
		return
	}
}

func deleteSubjects(w http.ResponseWriter) {
	Subjects = nil
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

	for i, subj := range Subjects {
		if subj.ID == id {
			Subjects = append(Subjects[:i], Subjects[i+1:]...)
			w.WriteHeader(http.StatusNoContent)
			return
		}
	}

	http.Error(w, "No such element with this ID", http.StatusNotFound)
}
