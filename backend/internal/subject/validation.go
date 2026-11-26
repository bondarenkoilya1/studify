package subject

import (
	"errors"
	"fmt"
	"strings"
	"unicode/utf8"
)

func validateCourse(course *int) error {
	if course == nil {
		return nil
	}

	if *course < 1 || *course > 6 {
		return errors.New("course must be between 1 and 6")
	}

	return nil
}

func validateTerm(term *int) error {
	if term == nil {
		return nil
	}

	if *term < 1 || *term > 4 {
		return errors.New("term must be between 1 and 4")
	}

	return nil
}

func validateCreateSubjectRequest(req *CreateSubjectRequest) error {
	if req.Type == "" {
		req.Type = "university"
	}
	if req.Scope == "" {
		req.Scope = "other"
	}
	if req.ExamType == "" {
		req.ExamType = "exam"
	}
	return validateSubjectChanges(&UpdateSubjectRequest{
		Name: &req.Name, Note: req.Note, Type: &req.Type, Scope: &req.Scope,
		ExamType: &req.ExamType, Course: req.Course, Term: req.Term,
		ThumbnailURL: req.ThumbnailURL,
	})
}

func validateSubjectChanges(req *UpdateSubjectRequest) error {
	if req.Name != nil && (strings.TrimSpace(*req.Name) == "" ||
		utf8.RuneCountInString(*req.Name) > 100 || strings.ContainsRune(*req.Name, 0)) {
		return errors.New("subject name must contain 1 to 100 characters and no NUL characters")
	}
	if req.Note != nil && (utf8.RuneCountInString(*req.Note) > 200 || strings.ContainsRune(*req.Note, 0)) {
		return errors.New("subject note must contain at most 200 characters and no NUL characters")
	}
	if req.ThumbnailURL != nil && strings.ContainsRune(*req.ThumbnailURL, 0) {
		return errors.New("subject thumbnail URL contains a NUL character")
	}
	if req.Type != nil && *req.Type != "university" && *req.Type != "personal" {
		return errors.New("invalid subject type")
	}
	if req.Scope != nil && !validScopes[*req.Scope] {
		return errors.New("invalid subject scope")
	}
	if req.ExamType != nil && !validExamTypes[*req.ExamType] {
		return errors.New("invalid exam type")
	}
	if err := validateCourse(req.Course); err != nil {
		return err
	}
	return validateTerm(req.Term)
}

func validateLecturers(lecturers []Lecturer) error {
	for i, lecturer := range lecturers {
		if strings.TrimSpace(lecturer.Name) == "" || utf8.RuneCountInString(lecturer.Name) > 100 ||
			strings.ContainsRune(lecturer.Name, 0) {
			return fmt.Errorf("lecturer %d name must contain 1 to 100 characters and no NUL characters", i+1)
		}
		switch lecturer.Position {
		case "lecturer", "practical_instructor", "lab_instructor", "assistant":
		default:
			return fmt.Errorf("invalid position for lecturer %d", i+1)
		}
	}
	return nil
}
