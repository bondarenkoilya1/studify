package subject

import (
	"database/sql"
	"time"
)

type Handler struct {
	DB *sql.DB
}

type Lecturer struct {
	Name     string
	Position string
}

type Subject struct {
	ID                int64      `json:"id"`
	UserID            int64      `json:"user_id"`
	Name              string     `json:"name"`
	Note              *string    `json:"note"`
	Type              string     `json:"type"`
	Scope             string     `json:"scope"`
	ExamDate          *time.Time `json:"exam_date"`
	Lecturers         []Lecturer `json:"lecturers"`
	LecturerAvatarURL *string    `json:"lecturer_avatar_url"`
}

type CreateSubjectRequest struct {
	Name              string     `json:"name"`
	Note              *string    `json:"note"`
	Type              string     `json:"type"`
	Scope             string     `json:"scope"`
	ExamDate          *time.Time `json:"exam_date"`
	Lecturers         []Lecturer `json:"lecturers"`
	LecturerAvatarURL *string    `json:"lecturer_avatar_url"`
}

type UpdateSubjectRequest struct {
	Name              *string     `json:"name"`
	Note              *string     `json:"note"`
	Type              *string     `json:"type"`
	Scope             *string     `json:"scope"`
	Lecturers         *[]Lecturer `json:"lecturers"`
	LecturerAvatarURL *string     `json:"lecturer_avatar_url"`
	ExamDate          *time.Time  `json:"exam_date"`
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
