package subject

import (
	"database/sql"
	"time"
)

type Handler struct {
	DB *sql.DB
}

type Subject struct {
	ID                int64      `json:"id"`
	UserID            int64      `json:"user_id"`
	Name              string     `json:"name"`
	Note              *string    `json:"note"`
	Type              string     `json:"type"`
	Scope             string     `json:"scope"`
	ExamDate          *time.Time `json:"exam_date"`
	Lecturer          *string    `json:"lecturer"`
	LecturerAvatarURL *string    `json:"lecturer_avatar_url"`
}

type CreateSubjectRequest struct {
	Name              string     `json:"name"`
	Note              *string    `json:"note"`
	Type              string     `json:"type"`
	Scope             string     `json:"scope"`
	ExamDate          *time.Time `json:"exam_date"`
	Lecturer          *string    `json:"lecturer"`
	LecturerAvatarURL *string    `json:"lecturer_avatar_url"`
}

type UpdateSubjectRequest struct {
	Name              *string    `json:"name"`
	Note              *string    `json:"note"`
	Type              *string    `json:"type"`
	Scope             *string    `json:"scope"`
	Lecturer          *string    `json:"lecturer"`
	LecturerAvatarURL *string    `json:"lecturer_avatar_url"`
	ExamDate          *time.Time `json:"exam_date"`
}
