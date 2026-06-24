package models

import "time"

type Subject struct {
	ID                int64      `json:"id"`
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
