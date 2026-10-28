package sharedproject

import (
	"database/sql"
	"errors"
	"fmt"
	"net/url"
	"strings"
)

func NewService(db *sql.DB) *Service {
	return &Service{db: db}
}

func (s *Service) createSharedProject(in createSharedProjectInput) (*SharedProject, error) {
	in.Name = strings.TrimSpace(in.Name)
	in.URL = strings.TrimSpace(in.URL)
	in.Author = strings.TrimSpace(in.Author)
	in.AuthorAvatarURL = strings.TrimSpace(in.AuthorAvatarURL)

	if in.Name == "" || in.Author == "" {
		return nil, fmt.Errorf("%w: name and author are required", ErrInvalidInput)
	}
	if err := validateURL(in.URL); err != nil {
		return nil, fmt.Errorf("%w: url: %v", ErrInvalidInput, err)
	}

	project, err := InsertSharedProject(
		s.db, in.UserID, in.Name, in.URL, in.Author, in.AuthorAvatarURL,
	)
	if err != nil {
		return nil, fmt.Errorf("create shared project: %w", err)
	}

	return project, nil
}

func (s *Service) getSharedProjectByID(id int64) (*SharedProject, error) {
	if id <= 0 {
		return nil, fmt.Errorf("%w: id must be positive", ErrInvalidInput)
	}

	project, err := GetSharedProjectByID(s.db, id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrSharedProjectNotFound
		}
		return nil, fmt.Errorf("get shared project: %w", err)
	}

	return project, nil
}

func (s *Service) getSharedProjectsByUserID(userID int64) ([]SharedProject, error) {
	projects, err := GetSharedProjectsByUserID(s.db, userID)
	if err != nil {
		return nil, fmt.Errorf("get shared projects by user id: %w", err)
	}

	return projects, nil
}

func validateURL(raw string) error {
	u, err := url.ParseRequestURI(raw)
	if err != nil {
		return err
	}
	if u.Scheme != "http" && u.Scheme != "https" {
		return errors.New("scheme must be http or https")
	}
	return nil
}
