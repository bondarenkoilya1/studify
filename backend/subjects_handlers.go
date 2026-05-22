package main

import (
	"encoding/json"
	"net/http"
	"studify/database"
)

func (h *Handler) GetSubject(w http.ResponseWriter, r *http.Request) {
	id, err := GetID(r)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	subject, err := database.GetSubjectByID(h.DB, id)
	if err != nil {
		http.Error(w, "Subject was not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err = json.NewEncoder(w).Encode(subject); err != nil {
		http.Error(w, "Failed to encode response", http.StatusInternalServerError)
		return
	}
}

func (h *Handler) GetSubjects(w http.ResponseWriter, _ *http.Request) {
	subjects, err := database.GetSubjects(h.DB)
	if err != nil {
		http.Error(w, "Failed to get subjects", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err = json.NewEncoder(w).Encode(subjects); err != nil {
		http.Error(w, "Failed to encode response", http.StatusInternalServerError)
		return
	}
}

//func AddSubjects(w http.ResponseWriter, r *http.Request) {
//	if !strings.Contains(r.Header.Get("Content-Type"), "application/json") {
//		http.Error(w, "You need to use the following header -> Content-Type: application/json", http.StatusUnsupportedMediaType)
//		return
//	}
//
//	var newSubjects []models.Subject
//
//	err := json.NewDecoder(r.Body).Decode(&newSubjects)
//	if err != nil {
//		http.Error(w, "Invalid JSON", http.StatusBadRequest)
//		return
//	}
//
//	for i := range newSubjects {
//		newSubjects[i].ID = models.NextSubjectID
//		models.NextSubjectID++
//	}
//
//	models.Subjects = append(models.Subjects, newSubjects...)
//	w.Header().Set("Content-Type", "application/json")
//	w.WriteHeader(http.StatusCreated)
//
//	if err = json.NewEncoder(w).Encode(&newSubjects); err != nil {
//		http.Error(w, "Cannot parse subjects as JSON", http.StatusInternalServerError)
//		return
//	}
//}

//func ReplaceSubject(w http.ResponseWriter, r *http.Request) {
//	if !strings.Contains(r.Header.Get("Content-Type"), "application/json") {
//		http.Error(w, "You need to use the following header -> Content-Type: application/json", http.StatusUnsupportedMediaType)
//		return
//	}
//
//	id, err := GetID(r)
//	if err != nil {
//		http.Error(w, err.Error(), http.StatusBadRequest)
//		return
//	}
//
//	var newSubject models.Subject
//	if err = json.NewDecoder(r.Body).Decode(&newSubject); err != nil {
//		http.Error(w, "Invalid JSON", http.StatusBadRequest)
//		return
//	}
//
//	for i, subj := range models.Subjects {
//		if subj.ID == id {
//			newSubject.ID = id
//			models.Subjects[i] = newSubject
//
//			w.Header().Set("Content-Type", "application/json")
//			if err = json.NewEncoder(w).Encode(models.Subjects[i]); err != nil {
//				log.Printf("Element was changed but cannot be returned as JSON because of encoding error: %v", err)
//			}
//			return
//		}
//	}
//
//	http.Error(w, fmt.Sprintf("No such element with ID: %d", id), http.StatusNotFound)
//}

func (h *Handler) DeleteSubjects(w http.ResponseWriter, _ *http.Request) {
	err := database.DeleteSubjects(h.DB)
	if err != nil {
		http.Error(w, "Failed to delete subjects", http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *Handler) DeleteSubject(w http.ResponseWriter, r *http.Request) {
	id, err := GetID(r)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if err = database.DeleteSubject(h.DB, id); err != nil {
		http.Error(w, "No such element with this ID", http.StatusNotFound)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
