package task

import (
	"bytes"
	"encoding/json"
	"fmt"
	"strings"
	"studify/internal/httpx"
	"time"
)

type calendarDate string

func (d *calendarDate) UnmarshalJSON(data []byte) error {
	var value string
	if err := json.Unmarshal(data, &value); err != nil {
		return err
	}
	parsed, err := time.Parse(time.DateOnly, value)
	if err != nil || parsed.Year() < 1 {
		return fmt.Errorf("invalid calendar date %q", value)
	}
	*d = calendarDate(value)
	return nil
}

func calendarDateFromTime(value *time.Time) *calendarDate {
	if value == nil {
		return nil
	}
	date := calendarDate(value.Format(time.DateOnly))
	return &date
}

type Handler struct {
	Service *Service
}

type Task struct {
	ID            int64         `json:"id"`
	SubjectID     int64         `json:"subject_id"`
	Name          string        `json:"name"`
	Type          string        `json:"type"`
	Description   string        `json:"description"`
	EstimatedTime *int          `json:"estimated_time"`
	ScheduledAt   *time.Time    `json:"scheduled_at"`
	Deadline      *time.Time    `json:"deadline"`
	ScheduledDate *calendarDate `json:"scheduled_date"`
	DeadlineDate  *calendarDate `json:"deadline_date"`
	Status        string        `json:"status"`
	Difficulty    string        `json:"difficulty"`
	Priority      string        `json:"priority"`
	CreatedAt     time.Time     `json:"created_at"`
	UpdatedAt     time.Time     `json:"updated_at"`
}

type updateTaskRequest struct {
	Name             *string       `json:"name"`
	Description      *string       `json:"description"`
	SubjectID        *int64        `json:"subject_id"`
	Type             *string       `json:"type"`
	EstimatedTime    *int          `json:"estimated_time"`
	ScheduledAt      *time.Time    `json:"scheduled_at"`
	Deadline         *time.Time    `json:"deadline"`
	ScheduledDate    *calendarDate `json:"scheduled_date"`
	DeadlineDate     *calendarDate `json:"deadline_date"`
	Status           *string       `json:"status"`
	Difficulty       *string       `json:"difficulty"`
	Priority         *string       `json:"priority"`
	EstimatedTimeSet bool          `json:"-"`
	ScheduleSet      bool          `json:"-"`
	DeadlineSet      bool          `json:"-"`
}

func (r *updateTaskRequest) UnmarshalJSON(data []byte) error {
	type requestAlias updateTaskRequest
	var decoded requestAlias
	if err := httpx.ReadJSON(bytes.NewReader(data), &decoded); err != nil {
		return err
	}
	*r = updateTaskRequest(decoded)

	var fields map[string]json.RawMessage
	if err := json.Unmarshal(data, &fields); err != nil {
		return err
	}
	for field := range fields {
		switch strings.ToLower(field) {
		case "estimated_time":
			r.EstimatedTimeSet = true
		case "scheduled_at", "scheduled_date":
			r.ScheduleSet = true
		case "deadline", "deadline_date":
			r.DeadlineSet = true
		}
	}
	return nil
}
