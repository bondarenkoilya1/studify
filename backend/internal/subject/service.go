package subject

import (
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"os"
)

func writeJSON(w http.ResponseWriter, status int, value any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)

	if err := json.NewEncoder(w).Encode(value); err != nil {
		log.Printf("failed to encode JSON response: %v", err)
	}
}

func ensureDir(path string) error {
	if err := os.MkdirAll(path, 0o755); err != nil {
		return fmt.Errorf("prepare storage directory %q: %w", path, err)
	}

	file, err := os.CreateTemp(path, ".check-*")
	if err != nil {
		return fmt.Errorf("storage directory %q is not writable: %w", path, err)
	}

	name := file.Name()

	if err := file.Close(); err != nil {
		return fmt.Errorf("close check file %q: %w", name, err)
	}

	if err := os.Remove(name); err != nil {
		return fmt.Errorf("remove check file %q: %w", name, err)
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

	if req.Term != nil && (*req.Term < 1 || *req.Term > 16) {
		return errors.New("term must be between 1 and 16")
	}

	return nil
}
