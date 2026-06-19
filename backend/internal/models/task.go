package models

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
