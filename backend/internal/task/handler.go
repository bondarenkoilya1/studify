package task

import (
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"log/slog"
	"net/http"
	"studify/internal/util"

	"studify/internal/httpx"
)

// respondError логирует ошибку и отправляет ответ клиенту.
func respondError(w http.ResponseWriter, r *http.Request, status int, msg string, err error, attrs ...any) {
	level := slog.LevelWarn
	if status >= http.StatusInternalServerError {
		level = slog.LevelError
	}

	args := append([]any{
		slog.String("method", r.Method),
		slog.String("path", r.URL.Path),
		slog.Any("error", err),
	}, attrs...)

	slog.Log(r.Context(), level, msg, args...)
	http.Error(w, msg, status)
}

func (h *Handler) GetTask(w http.ResponseWriter, r *http.Request) {
	userID, err := httpx.GetUserID(r)
	if err != nil {
		respondError(w, r, http.StatusUnauthorized, "unauthorized", err)
		return
	}

	id, err := httpx.GetID(r)
	if err != nil {
		respondError(w, r, http.StatusBadRequest, err.Error(), err, slog.Int64("user_id", userID))
		return
	}

	task, err := h.Service.getTask(id, userID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			respondError(w, r, http.StatusNotFound, "task was not found", err,
				slog.Int64("user_id", userID), slog.Int64("task_id", id))
			return
		}

		respondError(w, r, http.StatusInternalServerError, "failed to get task", err,
			slog.Int64("user_id", userID), slog.Int64("task_id", id))
		return
	}

	util.WriteJSON(w, r, http.StatusOK, task)
}

func (h *Handler) GetUserTasks(w http.ResponseWriter, r *http.Request) {
	userID, err := httpx.GetUserID(r)
	if err != nil {
		respondError(w, r, http.StatusUnauthorized, "unauthorized", err)
		return
	}

	tasks, err := h.Service.getUserTasks(userID)
	if err != nil {
		respondError(w, r, http.StatusInternalServerError, "failed to get tasks", err,
			slog.Int64("user_id", userID))
		return
	}

	util.WriteJSON(w, r, http.StatusOK, tasks)
}

func (h *Handler) GetSubjectTasks(w http.ResponseWriter, r *http.Request) {
	userID, err := httpx.GetUserID(r)
	if err != nil {
		respondError(w, r, http.StatusUnauthorized, "unauthorized", err)
		return
	}

	subjectID, err := httpx.GetID(r)
	if err != nil {
		respondError(w, r, http.StatusBadRequest, err.Error(), err, slog.Int64("user_id", userID))
		return
	}

	tasks, err := h.Service.getSubjectsTasks(subjectID, userID)
	if err != nil {
		respondError(w, r, http.StatusInternalServerError, "failed to get tasks by subject", err,
			slog.Int64("user_id", userID), slog.Int64("subject_id", subjectID))
		return
	}

	util.WriteJSON(w, r, http.StatusOK, tasks)
}

func (h *Handler) AddTask(w http.ResponseWriter, r *http.Request) {
	userID, err := httpx.GetUserID(r)
	if err != nil {
		respondError(w, r, http.StatusUnauthorized, "unauthorized", err)
		return
	}

	var newTask Task
	if err := json.NewDecoder(r.Body).Decode(&newTask); err != nil {
		respondError(w, r, http.StatusBadRequest, "invalid JSON", err, slog.Int64("user_id", userID))
		return
	}

	task, err := h.Service.addTask(userID, &newTask)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			respondError(w, r, http.StatusNotFound, "subject not found", err,
				slog.Int64("user_id", userID))
			return
		}

		respondError(w, r, http.StatusInternalServerError, "failed to insert task", err,
			slog.Int64("user_id", userID))
		return
	}

	util.WriteJSON(w, r, http.StatusCreated, task)
}

func (h *Handler) ReplaceTask(w http.ResponseWriter, r *http.Request) {
	userID, err := httpx.GetUserID(r)
	if err != nil {
		respondError(w, r, http.StatusUnauthorized, "unauthorized", err)
		return
	}

	id, err := httpx.GetID(r)
	if err != nil {
		respondError(w, r, http.StatusBadRequest, err.Error(), err, slog.Int64("user_id", userID))
		return
	}

	var newTask Task
	if err := json.NewDecoder(r.Body).Decode(&newTask); err != nil {
		respondError(w, r, http.StatusBadRequest, "invalid JSON", err,
			slog.Int64("user_id", userID), slog.Int64("task_id", id))
		return
	}

	task, err := h.Service.replaceTask(userID, id, &newTask)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			respondError(w, r, http.StatusNotFound, fmt.Sprintf("no task with ID: %d", id), err,
				slog.Int64("user_id", userID))
			return
		}

		respondError(w, r, http.StatusInternalServerError, "failed to replace task", err,
			slog.Int64("user_id", userID), slog.Int64("task_id", id))
		return
	}

	util.WriteJSON(w, r, http.StatusOK, task)
}

func (h *Handler) UpdateTask(w http.ResponseWriter, r *http.Request) {
	userID, err := httpx.GetUserID(r)
	if err != nil {
		respondError(w, r, http.StatusUnauthorized, "unauthorized", err)
		return
	}

	id, err := httpx.GetID(r)
	if err != nil {
		respondError(w, r, http.StatusBadRequest, err.Error(), err, slog.Int64("user_id", userID))
		return
	}

	var req updateTaskRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, r, http.StatusBadRequest, "invalid JSON", err,
			slog.Int64("user_id", userID), slog.Int64("task_id", id))
		return
	}

	task, err := h.Service.updateTask(userID, id, &req)
	if err != nil {
		switch {
		case errors.Is(err, ErrNoFieldsToUpdate):
			respondError(w, r, http.StatusBadRequest, "no fields to update", err,
				slog.Int64("user_id", userID), slog.Int64("task_id", id))
		case errors.Is(err, sql.ErrNoRows):
			respondError(w, r, http.StatusNotFound, "task not found", err,
				slog.Int64("user_id", userID), slog.Int64("task_id", id))
		default:
			respondError(w, r, http.StatusInternalServerError, "failed to update task", err,
				slog.Int64("user_id", userID), slog.Int64("task_id", id))
		}
		return
	}

	util.WriteJSON(w, r, http.StatusOK, task)
}

func (h *Handler) DeleteUserTasks(w http.ResponseWriter, r *http.Request) {
	userID, err := httpx.GetUserID(r)
	if err != nil {
		respondError(w, r, http.StatusUnauthorized, "unauthorized", err)
		return
	}

	if err := h.Service.deleteUserTasks(userID); err != nil {
		respondError(w, r, http.StatusInternalServerError, "failed to delete tasks", err,
			slog.Int64("user_id", userID))
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (h *Handler) DeleteTask(w http.ResponseWriter, r *http.Request) {
	userID, err := httpx.GetUserID(r)
	if err != nil {
		respondError(w, r, http.StatusUnauthorized, "unauthorized", err)
		return
	}

	id, err := httpx.GetID(r)
	if err != nil {
		respondError(w, r, http.StatusBadRequest, err.Error(), err, slog.Int64("user_id", userID))
		return
	}

	if err := h.Service.deleteTask(userID, id); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			respondError(w, r, http.StatusNotFound, fmt.Sprintf("no task with ID: %d", id), err,
				slog.Int64("user_id", userID))
			return
		}

		respondError(w, r, http.StatusInternalServerError, "failed to delete task", err,
			slog.Int64("user_id", userID), slog.Int64("task_id", id))
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
