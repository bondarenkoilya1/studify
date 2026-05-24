package models

type Subject struct {
	ID       int64  `json:"id"`
	Name     string `json:"name"`
	Lecturer string `json:"lecturer"`
	ExamDate string `json:"exam_date"`
}

type Task struct {
	ID        int64  `json:"id"`
	Name      string `json:"name"`
	DueDate   string `json:"due_date"`
	Status    string `json:"status"`
	SubjectID int64  `json:"subject_id"`
}
