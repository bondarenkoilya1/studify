package handlers

import (
	"encoding/json"
	"log"
	"math"
	"net/http"
	"studify/internal/database"
	"studify/internal/models"
)

type DashboardStatus struct {
	TotalSubjects       int64         `json:"total_subjects"`
	TotalTasks          int64         `json:"total_tasks"`
	TotalCompletedTasks int64         `json:"total_completed_tasks"`
	TotalOngoingTasks   int64         `json:"total_ongoing_tasks"`
	TotalNotCompleted   int64         `json:"total_not_completed_tasks"`
	CompletionPercent   float64       `json:"completion_percent"`
	NearestDeadlineTask *models.Task  `json:"nearest_deadline_task"`
	OverdueTasks        []models.Task `json:"overdue_tasks"`
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

	totalNotCompletedTasks, err := database.GetNotCompletedTasksCount(h.DB)
	if err != nil {
		http.Error(w, "Failed to get not completed tasks count", http.StatusInternalServerError)
		return
	}

	var completionPercent float64
	if totalCompletedTasks == 0 {
		completionPercent = 0
	} else {
		completionPercent = float64(totalCompletedTasks) * 100 / float64(totalTasks)
		completionPercent = math.Round(completionPercent*100) / 100
	}

	nearestDeadlineTask, err := database.GetNearestDeadlineTask(h.DB)
	if err != nil {
		http.Error(w, "Failed to get nearest deadline task", http.StatusInternalServerError)
		return
	}

	overdueTasks, err := database.GetOverdueTasks(h.DB)
	if err != nil {
		http.Error(w, "Failed to get overdue tasks", http.StatusInternalServerError)
		return
	}

	response := DashboardStatus{
		TotalSubjects:       totalSubjects,
		TotalTasks:          totalTasks,
		TotalCompletedTasks: totalCompletedTasks,
		TotalOngoingTasks:   totalOngoingTasks,
		TotalNotCompleted:   totalNotCompletedTasks,
		CompletionPercent:   completionPercent,
		NearestDeadlineTask: nearestDeadlineTask,
		OverdueTasks:        overdueTasks,
	}

	w.Header().Set("Content-Type", "application/json")
	if err = json.NewEncoder(w).Encode(response); err != nil {
		log.Printf("Failed to encode response as JSON: %v", err)
	}
}
