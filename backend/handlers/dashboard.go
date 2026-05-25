package handlers

import (
	"encoding/json"
	"log"
	"net/http"
	"studify/database"
)

type DashboardStatus struct {
	TotalSubjects int64 `json:"total_subjects"`
	TotalTasks    int64 `json:"total_tasks"`
}

func (h *Handler) GetDashboardStatus(w http.ResponseWriter, r *http.Request) {

	totalSubjects, err := database.GetSubjectsCount(h.DB)
	if err != nil {
		http.Error(w, "Failed to get subjects count", http.StatusInternalServerError)
		return
	}

	totalTasks, err := database.GetTasksCount(h.DB)
	if err != nil {
		http.Error(w, "Failed to get tasks count", http.StatusInternalServerError)
		return
	}

	response := DashboardStatus{
		TotalSubjects: totalSubjects,
		TotalTasks:    totalTasks,
	}

	w.Header().Set("Content-Type", "application/json")
	if err = json.NewEncoder(w).Encode(response); err != nil {
		log.Fatalf("Failed to encode response as JSON: %v", err)
	}
}
