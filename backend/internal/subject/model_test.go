package subject

import (
	"encoding/json"
	"testing"
)

func TestUpdateSubjectRequestUnmarshalExamDate(t *testing.T) {
	tests := []struct {
		name     string
		body     string
		wantSet  bool
		wantDate bool
	}{
		{
			name:    "field omitted",
			body:    `{"exam_type":"exam"}`,
			wantSet: false,
		},
		{
			name:     "field set to date",
			body:     `{"exam_date":"2026-12-20T09:00:00Z"}`,
			wantSet:  true,
			wantDate: true,
		},
		{
			name:    "field cleared",
			body:    `{"exam_date":null}`,
			wantSet: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			var req UpdateSubjectRequest
			if err := json.Unmarshal([]byte(tt.body), &req); err != nil {
				t.Fatalf("Unmarshal() error = %v", err)
			}

			if req.ExamDateSet != tt.wantSet {
				t.Fatalf("ExamDateSet = %v, want %v", req.ExamDateSet, tt.wantSet)
			}
			if (req.ExamDate != nil) != tt.wantDate {
				t.Fatalf("ExamDate presence = %v, want %v", req.ExamDate != nil, tt.wantDate)
			}
		})
	}
}

func TestUpdateSubjectRequestIsEmpty(t *testing.T) {
	var req UpdateSubjectRequest
	if !req.isEmpty() {
		t.Fatal("zero request should be empty")
	}

	req.ExamDateSet = true
	if req.isEmpty() {
		t.Fatal("exam_date: null should make the request non-empty")
	}
}

func TestUpdateSubjectRequestKeepsExplicitNulls(t *testing.T) {
	var request UpdateSubjectRequest
	if err := json.Unmarshal([]byte(`{"NOTE":null,"course":null,"term":null,"lecturers":[]}`), &request); err != nil {
		t.Fatal(err)
	}
	if request.isEmpty() || !request.NoteSet || !request.CourseSet || !request.TermSet || !request.LecturersSet {
		t.Fatalf("explicit clears must count as changes: %+v", request)
	}
	if request.Note != nil || request.Course != nil || request.Term != nil || request.Lecturers == nil || len(*request.Lecturers) != 0 {
		t.Fatalf("unexpected cleared values: %+v", request)
	}
}
