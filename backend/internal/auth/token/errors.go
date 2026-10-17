package token

import "errors"

var (
	ErrInvalidAccessToken  = errors.New("invalid access token")
	ErrInvalidRefreshToken = errors.New("invalid refresh token")
	ErrEmptyTokenSubject   = errors.New("empty token subject")
	ErrEmptyTokenID        = errors.New("empty token id")

	ErrChallengeTokenNotFound = errors.New("auth challenge not found")
)
