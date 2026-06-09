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

type Task struct {
	ID        int64  `json:"id"`
	Name      string `json:"name"`
	SubjectID int64  `json:"subject_id"`
	Deadline  string `json:"deadline"`
	Status    string `json:"status"`
}

type UpdateTaskRequest struct {
	Name      *string `json:"name"`
	SubjectID *int64  `json:"subject_id"`
	Deadline  *string `json:"deadline"`
	Status    *string `json:"status"`
}

type User struct {
	ID       int64  `json:"id"`
	Username string `json:"username"`
	Password string `json:"-"`
}
