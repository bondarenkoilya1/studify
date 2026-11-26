package task

import (
	"encoding/json"
	"testing"
)

func TestUpdateTaskRequestNullableFields(t *testing.T) {
	var request updateTaskRequest
	if err := json.Unmarshal([]byte(`{"estimated_time":null,"scheduled_date":null,"deadline":null}`), &request); err != nil {
		t.Fatal(err)
	}
	if request.isEmpty() || !request.EstimatedTimeSet || !request.ScheduleSet || !request.DeadlineSet {
		t.Fatalf("explicit clears must count as changes: %+v", request)
	}
	if request.EstimatedTime != nil || request.ScheduledDate != nil || request.ScheduledAt != nil || request.Deadline != nil || request.DeadlineDate != nil {
		t.Fatalf("unexpected cleared values: %+v", request)
	}
	if err := json.Unmarshal([]byte(`{"status":"completed"}`), &request); err != nil {
		t.Fatal(err)
	}
	if request.EstimatedTimeSet || request.ScheduleSet || request.DeadlineSet {
		t.Fatalf("status-only updates should keep the dates and estimate: %+v", request)
	}
}
