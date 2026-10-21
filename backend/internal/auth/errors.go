package auth

import "errors"

var (
	ErrInvalidToken           = errors.New("invalid refresh token")
	ErrTokenNotFound          = errors.New("refresh token not found")
	ErrRequiredChallengeToken = errors.New("challenge token is required")
	ErrRequiredTOTPCode       = errors.New("TOTP code is required")
	ErrChallengeExpired       = errors.New("challenge token expired")
	ErrInvalidTOTPCode        = errors.New("invalid TOTP code")
)
