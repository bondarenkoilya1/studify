package subject

import (
	"encoding/json"
	"errors"
	"log"
	"net/http"

	"github.com/jackc/pgx/v5/pgconn"
)

func writeJSON(w http.ResponseWriter, status int, value any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)

	if err := json.NewEncoder(w).Encode(value); err != nil {
		log.Printf("failed to encode JSON response: %v", err)
	}
}

func validateTerm(term *int) error {
	if term == nil {
		return nil
	}

	if *term < 1 || *term > 16 {
		return errors.New("term must be between 1 and 16")
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

// DB
func normalizeUniqueSubjectError(err error) error {
	if err == nil {
		return nil
	}

	var pgErr *pgconn.PgError
	if errors.As(err, &pgErr) && pgErr.Code == "23505" {
		return ErrSubjectAlreadyExists
	}

	return err
}
