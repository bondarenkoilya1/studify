package subject

import (
	"database/sql"
	"time"
)

type Handler struct {
	DB *sql.DB
}

type Lecturer struct {
	Name     string `json:"name"`
	Position string `json:"position"`
}

type Subject struct {
	ID           int64      `json:"id"`
	UserID       int64      `json:"user_id"`
	Name         string     `json:"name"`
	Note         *string    `json:"note"`
	Type         string     `json:"type"`
	Scope        string     `json:"scope"`
	ExamDate     *time.Time `json:"exam_date"`
	Term         *int       `json:"term"`
	Lecturers    []Lecturer `json:"lecturers"`
	ThumbnailURL *string    `json:"thumbnail_url"`
}

type CreateSubjectRequest struct {
	Name         string     `json:"name"`
	Note         *string    `json:"note"`
	Type         string     `json:"type"`
	Scope        string     `json:"scope"`
	ExamDate     *time.Time `json:"exam_date"`
	Term         *int       `json:"term"`
	Lecturers    []Lecturer `json:"lecturers"`
	ThumbnailURL *string    `json:"thumbnail_url"`
}

type UpdateSubjectRequest struct {
	Name         *string     `json:"name"`
	Note         *string     `json:"note"`
	Type         *string     `json:"type"`
	Scope        *string     `json:"scope"`
	Lecturers    *[]Lecturer `json:"lecturers"`
	ThumbnailURL *string     `json:"thumbnail_url"`
	ExamDate     *time.Time  `json:"exam_date"`
	Term         *int        `json:"term"`
}

var validScopes = map[string]bool{
	"technology": true,
	"healthcare": true,
	"humanities": true,
	"business":   true,
	"social":     true,
	"science":    true,
	"other":      true,
}
