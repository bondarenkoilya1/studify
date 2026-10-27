package sharedproject

import "errors"

var (
	ErrInvalidInput               = errors.New("invalid shared project input")
	ErrSharedProjectNotFound      = errors.New("shared project not found")
	ErrSharedProjectAlreadyExists = errors.New("shared project already exists")
)
