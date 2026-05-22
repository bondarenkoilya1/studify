package models

type Subject struct {
	ID       int64  `json:"id"`
	Name     string `json:"name"`
	Lecturer string `json:"lecturer"`
	ExamDate string `json:"exam_date"`
}

type Task struct {
	ID      int64  `json:"id"`
	Name    string `json:"name"`
	Subject string `json:"subject"`
	DueDate string `json:"due_date"`
	Status  string `json:"status"`
}

var Subjects = []Subject{}
var Tasks = []Task{}

var NextSubjectID int64 = 1
var NextTaskID int64 = 1
