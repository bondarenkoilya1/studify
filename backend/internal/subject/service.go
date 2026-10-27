package subject

import (
	"encoding/json"
	"errors"
	"log/slog"
	"net/http"
)

func writeJSON(w http.ResponseWriter, status int, value any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)

	if err := json.NewEncoder(w).Encode(value); err != nil {
		slog.Error("failed to encode JSON response", slog.String("error", err.Error()))
	}
}

func validateCourse(course *int) error {
	if course == nil {
		return nil
	}

	if *course < 1 || *course > 6 {
		return errors.New("course must be between 1 and 6")
	}

	return nil
}

func validateTerm(term *int) error {
	if term == nil {
		return nil
	}

	if *term < 1 || *term > 4 {
		return errors.New("term must be between 1 and 4")
	}

	return nil
}

func validateCreateSubjectRequest(req *CreateSubjectRequest) error {
	if req.Name == "" {
		return errors.New("subject name is required")
	}

	if req.Type == "" {
		req.Type = "university"
	}

	if req.Type != "university" && req.Type != "personal" {
		return errors.New("invalid subject type")
	}

	if req.Scope == "" {
		req.Scope = "other"
	}

	if !validScopes[req.Scope] {
		return errors.New("invalid subject scope")
	}

	if req.ExamType == "" {
		req.ExamType = "exam"
	}

	if !validExamTypes[req.ExamType] {
		return errors.New("invalid exam type")
	}

	return nil
}
