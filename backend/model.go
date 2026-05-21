package main

import "time"

type Subject struct {
	ID       int       `json:"id"`
	Lecturer string    `json:"lecturer"`
	ExamDate time.Time `json:"exam_date"`
}

var Subjects []Subject
var NextID = 1
