package token

import "errors"

type AccessToken string
type RefreshToken string
type Token string
type TokenID string

var (
	ErrEmptyTokenSubject = errors.New("empty token subject")
	ErrEmptyTokenID      = errors.New("empty token id")
)
