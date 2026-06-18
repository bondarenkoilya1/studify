package utils

import "errors"

var (
	ErrInvalidAccessToken = errors.New("invalid access token")
	ErrEmptyTokenSubject  = errors.New("empty token subject")
)
