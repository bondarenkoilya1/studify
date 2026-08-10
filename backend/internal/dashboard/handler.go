package dashboard

import (
	"encoding/json"
	"log"
	"math"
	"net/http"
	"studify/internal/httpx"
)

func (h *Handler) GetDashboardStatus(w http.ResponseWriter, r *http.Request) {
	userID, err := httpx.GetUserID(r)
	if err != nil {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	totalSubjects, err := GetSubjectsCount(h.DB, userID)
	if err != nil {
		log.Printf("failed to get dashboard subjects count for user %d: %v", userID, err)
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	totalTasks, err := GetTasksCount(h.DB, userID)
	if err != nil {
		log.Printf("failed to get dashboard tasks count for user %d: %v", userID, err)
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	totalCompletedTasks, err := GetCompletedTasksCount(h.DB, userID)
	if err != nil {
		log.Printf("failed to get dashboard completed tasks count for user %d: %v", userID, err)
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	totalOngoingTasks, err := GetOngoingTasksCount(h.DB, userID)
	if err != nil {
		log.Printf("failed to get dashboard ongoing tasks count for user %d: %v", userID, err)
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	totalNotCompletedTasks, err := GetNotCompletedTasksCount(h.DB, userID)
	if err != nil {
		log.Printf("failed to get dashboard not completed tasks count for user %d: %v", userID, err)
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	var completionPercent float64
	if totalTasks == 0 {
		completionPercent = 0
	} else {
		completionPercent = float64(totalCompletedTasks) * 100 / float64(totalTasks)
		completionPercent = math.Round(completionPercent*100) / 100
	}

	nearestDeadlineTask, err := GetNearestDeadlineTask(h.DB, userID)
	if err != nil {
		log.Printf("failed to get nearest deadline task for user %d: %v", userID, err)
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	overdueTasks, err := GetOverdueTasks(h.DB, userID)
	if err != nil {
		log.Printf("failed to get overdue tasks for user %d: %v", userID, err)
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	response := Status{
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

	if err := json.NewEncoder(w).Encode(response); err != nil {
		log.Printf("failed to encode dashboard response for user %d: %v", userID, err)
	}
}

// Todo: Gather some sql request into a single one
