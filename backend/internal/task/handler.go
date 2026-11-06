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
		util.AttrMethod(r.Method),
		util.AttrPath(r.URL.Path),
		util.AttrAnyError(err),
	}, attrs...)

	//nolint:sloglint // helper function forwards dynamic error message
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
		respondError(w, r, http.StatusBadRequest, err.Error(), err, util.AttrUserID(userID))
		return
	}

	task, err := h.Service.getTask(id, userID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			respondError(w, r, http.StatusNotFound, "task was not found", err,
				util.AttrUserID(userID), util.AttrTaskID(id))
			return
		}

		respondError(w, r, http.StatusInternalServerError, "failed to get task", err,
			util.AttrUserID(userID), util.AttrTaskID(id))
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
			util.AttrUserID(userID))
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
		respondError(w, r, http.StatusBadRequest, err.Error(), err, util.AttrUserID(userID))
		return
	}

	tasks, err := h.Service.getSubjectsTasks(subjectID, userID)
	if err != nil {
		respondError(w, r, http.StatusInternalServerError, "failed to get tasks by subject", err,
			util.AttrUserID(userID), util.AttrSubjectID(subjectID))
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
		respondError(w, r, http.StatusBadRequest, "invalid JSON", err, util.AttrUserID(userID))
		return
	}

	task, err := h.Service.addTask(userID, &newTask)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			respondError(w, r, http.StatusNotFound, "subject not found", err,
				util.AttrUserID(userID))
			return
		}

		respondError(w, r, http.StatusInternalServerError, "failed to insert task", err,
			util.AttrUserID(userID))
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
		respondError(w, r, http.StatusBadRequest, err.Error(), err, util.AttrUserID(userID))
		return
	}

	var newTask Task
	if err := json.NewDecoder(r.Body).Decode(&newTask); err != nil {
		respondError(w, r, http.StatusBadRequest, "invalid JSON", err,
			util.AttrUserID(userID), util.AttrTaskID(id))
		return
	}

	task, err := h.Service.replaceTask(userID, id, &newTask)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			respondError(w, r, http.StatusNotFound, fmt.Sprintf("no task with ID: %d", id), err,
				util.AttrUserID(userID))
			return
		}

		respondError(w, r, http.StatusInternalServerError, "failed to replace task", err,
			util.AttrUserID(userID), util.AttrTaskID(id))
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
		respondError(w, r, http.StatusBadRequest, err.Error(), err, util.AttrUserID(userID))
		return
	}

	var req updateTaskRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, r, http.StatusBadRequest, "invalid JSON", err,
			util.AttrUserID(userID), util.AttrTaskID(id))
		return
	}

	task, err := h.Service.updateTask(userID, id, &req)
	if err != nil {
		switch {
		case errors.Is(err, ErrNoFieldsToUpdate):
			respondError(w, r, http.StatusBadRequest, "no fields to update", err,
				util.AttrUserID(userID), util.AttrTaskID(id))
		case errors.Is(err, sql.ErrNoRows):
			respondError(w, r, http.StatusNotFound, "task not found", err,
				util.AttrUserID(userID), util.AttrTaskID(id))
		default:
			respondError(w, r, http.StatusInternalServerError, "failed to update task", err,
				util.AttrUserID(userID), util.AttrTaskID(id))
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
			util.AttrUserID(userID))
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
		respondError(w, r, http.StatusBadRequest, err.Error(), err, util.AttrUserID(userID))
		return
	}

	if err := h.Service.deleteTask(userID, id); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			respondError(w, r, http.StatusNotFound, fmt.Sprintf("no task with ID: %d", id), err,
				util.AttrUserID(userID))
			return
		}

		respondError(w, r, http.StatusInternalServerError, "failed to delete task", err,
			util.AttrUserID(userID), util.AttrTaskID(id))
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
