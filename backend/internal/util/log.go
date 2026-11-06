package util

import (
	"log/slog"
	"time"
)

const (
	KeyError         = "error"
	KeyUserID        = "user_id"
	KeySessionID     = "session_id"
	KeySubjectID     = "subject_id"
	KeyTaskID        = "task_id"
	KeyMethod        = "method"
	KeyPath          = "path"
	KeyURL           = "url"
	KeyStatus        = "status"
	KeyDuration      = "duration"
	KeyCorrelationID = "correlation_id"
)

func AttrError(err error) slog.Attr {
	if err == nil {
		return slog.String(KeyError, "")
	}
	return slog.String(KeyError, err.Error())
}

func AttrAnyError(err any) slog.Attr {
	return slog.Any(KeyError, err)
}

func AttrUserID(id int64) slog.Attr {
	return slog.Int64(KeyUserID, id)
}

func AttrSessionID(id int64) slog.Attr {
	return slog.Int64(KeySessionID, id)
}

func AttrSubjectID(id int64) slog.Attr {
	return slog.Int64(KeySubjectID, id)
}

func AttrTaskID(id int64) slog.Attr {
	return slog.Int64(KeyTaskID, id)
}

func AttrMethod(method string) slog.Attr {
	return slog.String(KeyMethod, method)
}

func AttrPath(path string) slog.Attr {
	return slog.String(KeyPath, path)
}

func AttrURL(url string) slog.Attr {
	return slog.String(KeyURL, url)
}

func AttrStatus(status int) slog.Attr {
	return slog.Int(KeyStatus, status)
}

func AttrDuration(d time.Duration) slog.Attr {
	return slog.Duration(KeyDuration, d)
}

func AttrCorrelationID(id string) slog.Attr {
	return slog.String(KeyCorrelationID, id)
}
