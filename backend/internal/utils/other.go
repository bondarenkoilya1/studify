package utils

import (
	"errors"
	"fmt"
	"net/http"
	"os"
	"strconv"
	"studify/internal/models"

	"github.com/go-chi/chi/v5"
)

func GetID(r *http.Request) (int64, error) {
	idStr := chi.URLParam(r, "id")
	if idStr == "" {
		return 0, fmt.Errorf("missing ID")
	}

	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		return 0, fmt.Errorf("ID must be an integer")
	}

	return id, nil
}

func EnsureDir(path string) error {
	if err := os.MkdirAll(path, 0o755); err != nil {
		return fmt.Errorf("prepare storage directory %q: %w", path, err)
	}

	file, err := os.CreateTemp(path, ".check-*")
	if err != nil {
		return fmt.Errorf("storage directory %q is not writable: %w", path, err)
	}

	name := file.Name()

	if err = file.Close(); err != nil {
		return fmt.Errorf("close check file %q: %w", name, err)
	}

	if err = os.Remove(name); err != nil {
		return fmt.Errorf("remove check file %q: %w", name, err)
	}

	return nil
}

func ValidateCredentials(body models.UserRequest, action models.AuthAction) error {
	if body.Username == "" {
		return errors.New("username is empty")
	}

	if body.Password == "" {
		return errors.New("password is empty")
	}

	if len(body.Password) > 72 && action == models.AuthActionRegister {
		return errors.New("password is too long")
	}

	return nil
}
