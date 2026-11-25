package user

type Handler struct {
	Service *Service
}

type User struct {
	ID              int64   `json:"id"`
	Email           string  `json:"email"`
	PasswordHash    string  `json:"-"`
	IsEmailVerified bool    `json:"is_email_verified"`
	IsTOTPEnabled   bool    `json:"is_totp_enabled"`
	AvatarURL       *string `json:"avatar_url"`
}

type emailRequest struct {
	NewEmail string `json:"new_email"`
}

type passwordRequest struct {
	CurrentPassword string `json:"current_password"`
	NewPassword     string `json:"new_password"`
}

type avatarResponse struct {
	AvatarURL string `json:"avatar_url"`
}
