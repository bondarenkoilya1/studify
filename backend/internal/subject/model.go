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
	Lecturer          string     `json:"lecturer"`
	LecturerAvatarURL string     `json:"lecturer_avatar_url"`
	ExamDate          *time.Time `json:"exam_date"`
}

type UpdateSubjectRequest struct {
	Name     *string    `json:"name"`
	Lecturer *string    `json:"lecturer"`
	ExamDate *time.Time `json:"exam_date"`
}
