package auth

import "errors"

var (
	ErrInvalidToken           = errors.New("invalid refresh token")
	ErrTokenNotFound          = errors.New("refresh token not found")
	ErrInvalidCredentials     = errors.New("invalid email or password")
	ErrInvalidRegistration    = errors.New("invalid registration details")
	ErrRequiredChallengeToken = errors.New("challenge token is required")
	ErrRequiredMFACode        = errors.New("authentication code is required")
	ErrChallengeExpired       = errors.New("challenge token expired")
	ErrInvalidMFACode         = errors.New("invalid authentication code")
)
