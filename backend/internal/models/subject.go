package models

type Subject struct {
	ID                int64  `json:"id"`
	Name              string `json:"name"`
	Lecturer          string `json:"lecturer"`
	LecturerAvatarURL string `json:"lecturer_avatar_url"`
	ExamDate          string `json:"exam_date"`
}

type UpdateSubjectRequest struct {
	Name     *string `json:"name"`
	Lecturer *string `json:"lecturer"`
	ExamDate *string `json:"exam_date"`
}
