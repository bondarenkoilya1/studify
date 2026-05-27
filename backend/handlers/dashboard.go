package handlers

import (
	"encoding/json"
	"log"
	"net/http"
	"studify/database"
)

type DashboardStatus struct {
	TotalSubjects       int64 `json:"total_subjects"`
	TotalTasks          int64 `json:"total_tasks"`
	TotalCompletedTasks int64 `json:"total_completed_tasks"`
	TotalOngoingTasks   int64 `json:"total_ongoing_tasks"`
	TotalTodoTasks      int64 `json:"total_todo_tasks"`
	CompletionPercent   int64 `json:"completion_percent"`
}

//type DashboardOverview struct {
//NearestDeadlineTask models.Task   `json:"nearest_deadline_task"`
//OverdueTasks        []models.Task `json:"overdue_tasks"`
//}

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

	totalCompletedTasks, err := database.GetCompletedTasksCount(h.DB)
	if err != nil {
		http.Error(w, "Failed to get completed tasks count", http.StatusInternalServerError)
		return
	}

	totalOngoingTasks, err := database.GetOngoingTasksCount(h.DB)
	if err != nil {
		http.Error(w, "Failed to get completed tasks count", http.StatusInternalServerError)
		return
	}

	totalTodoTasks, err := database.GetTodoTasksCount(h.DB)
	if err != nil {
		http.Error(w, "Failed to get completed tasks count", http.StatusInternalServerError)
		return
	}

	completionPercent := totalCompletedTasks / totalTasks * 100

	response := DashboardStatus{
		TotalSubjects:       totalSubjects,
		TotalTasks:          totalTasks,
		TotalCompletedTasks: totalCompletedTasks,
		TotalOngoingTasks:   totalOngoingTasks,
		TotalTodoTasks:      totalTodoTasks,
		CompletionPercent:   completionPercent,
	}

	w.Header().Set("Content-Type", "application/json")
	if err = json.NewEncoder(w).Encode(response); err != nil {
		log.Printf("Failed to encode response as JSON: %v", err)
	}
}

// completion percent
