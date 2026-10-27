package sharedproject

import "errors"

var (
	ErrInvalidInput               = errors.New("invalid shared project input")
	ErrSharedProjectAlreadyExists = errors.New("shared project already exists")
)
