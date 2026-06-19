package utils

import "errors"

var (
	ErrInvalidAccessToken  = errors.New("invalid access token")
	ErrInvalidRefreshToken = errors.New("invalid access token")
	ErrEmptyTokenSubject   = errors.New("empty token subject")
	ErrEmptyTokenID        = errors.New("empty token id")
)
