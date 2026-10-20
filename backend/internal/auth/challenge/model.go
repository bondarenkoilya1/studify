package challenge

import "errors"

const (
	authChallengeTokenType = "auth_challenge"
)

var ErrChallengeTokenNotFound = errors.New("auth challenge not found")
