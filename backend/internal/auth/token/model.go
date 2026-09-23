package token

// Refresh token

type RefreshToken string
type TokenHash string
type TokenID string

const (
	emailConfirmTokenType  = "email_confirmation"
	authChallengeTokenType = "auth_challenge"
)
