package subject

import (
	"bytes"
	"encoding/json"
	"strings"
	"studify/internal/httpx"
	"time"
)

type Handler struct {
	Service *Service
}

type Lecturer struct {
	Name     string `json:"name"`
	Position string `json:"position"`
}

type File struct {
	OriginalName string `json:"name"`
	Url          string `json:"url"`
	SizeBytes    string `json:"size_bytes"`
	ContentType  string `json:"content_type"`
}

type Subject struct {
	ID           int64      `json:"id"`
	UserID       int64      `json:"user_id"`
	Name         string     `json:"name"`
	Note         *string    `json:"note"`
	Type         string     `json:"type"`
	Scope        string     `json:"scope"`
	ExamType     string     `json:"exam_type"`
	ExamDate     *time.Time `json:"exam_date"`
	Course       *int       `json:"course"` // Pointer because it can be not specified
	Term         *int       `json:"term"`   // Pointer because it can be not specified
	Lecturers    []Lecturer `json:"lecturers"`
	ThumbnailURL *string    `json:"thumbnail_url"`
	Files        []File     `json:"files"`
}

type CreateSubjectRequest struct {
	Name         string     `json:"name"`
	Note         *string    `json:"note"`
	Type         string     `json:"type"`
	Scope        string     `json:"scope"`
	ExamType     string     `json:"exam_type"`
	ExamDate     *time.Time `json:"exam_date"`
	Course       *int       `json:"course"`
	Term         *int       `json:"term"`
	Lecturers    []Lecturer `json:"lecturers"`
	ThumbnailURL *string    `json:"thumbnail_url"`
}

type UpdateSubjectRequest struct {
	Name         *string     `json:"name"`
	Note         *string     `json:"note"`
	Type         *string     `json:"type"`
	Scope        *string     `json:"scope"`
	ExamType     *string     `json:"exam_type"`
	Lecturers    *[]Lecturer `json:"lecturers"`
	ThumbnailURL *string     `json:"thumbnail_url"`
	ExamDate     *time.Time  `json:"exam_date"`
	Course       *int        `json:"course"`
	Term         *int        `json:"term"`
	ExamDateSet  bool        `json:"-"`
	NoteSet      bool        `json:"-"`
	CourseSet    bool        `json:"-"`
	TermSet      bool        `json:"-"`
	LecturersSet bool        `json:"-"`
}

func (r *UpdateSubjectRequest) UnmarshalJSON(data []byte) error {
	type updateSubjectRequestAlias UpdateSubjectRequest

	var decoded updateSubjectRequestAlias
	if err := httpx.ReadJSON(bytes.NewReader(data), &decoded); err != nil {
		return err
	}

	*r = UpdateSubjectRequest(decoded)

	var fields map[string]json.RawMessage
	if err := json.Unmarshal(data, &fields); err != nil {
		return err
	}

	for field := range fields {
		switch strings.ToLower(field) {
		case "exam_date":
			r.ExamDateSet = true
		case "note":
			r.NoteSet = true
		case "course":
			r.CourseSet = true
		case "term":
			r.TermSet = true
		case "lecturers":
			r.LecturersSet = true
		}
	}

	return nil
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

var validExamTypes = map[string]bool{
	"exam":       true,
	"credit":     true,
	"coursework": true,
	"project":    true,
	"other":      true,
}

type thumbnail struct {
	ThumbnailURL string `json:"thumbnail_url"`
}

type fileResponse struct {
	FileURL string `json:"file_url"`
}
