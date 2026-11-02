package session

import "errors"

var ErrNotFoundSession = errors.New("session not found")
var ErrInvalidInput = errors.New("invalid session input")
