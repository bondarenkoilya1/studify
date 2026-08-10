package util

import (
	"database/sql"
	"time"
)

func NullTimePtr(value sql.NullTime) *time.Time {
	if !value.Valid {
		return nil
	}

	return &value.Time
}
