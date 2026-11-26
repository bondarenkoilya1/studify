package internal

import (
	"errors"

	"github.com/jackc/pgx/v5/pgconn"
)

// IsInvalidData identifies PostgreSQL rejections of input values.
func IsInvalidData(err error) bool {
	dbErr, ok := errors.AsType[*pgconn.PgError](err)
	if !ok {
		return false
	}
	switch dbErr.Code {
	case "23514", "22001", "22003", "22008", "22021":
		return true
	default:
		return false
	}
}
