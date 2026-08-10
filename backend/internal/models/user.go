package models

// User stores ID for some important implementations, where we can't afford bugs due to username change.
type User struct {
	ID              int64  `json:"id"`
	Email           string `json:"email"`
	Password        string `json:"-"`
	IsEmailVerified bool   `json:"is_email_verified"`
	IsTOTPEnabled   bool   `json:"is_totp_enabled"`
}

type UserRequest struct {
	Email           string `json:"email"`
	Password        string `json:"password"`
	IsEmailVerified bool   `json:"is_email_verified"`
	TOTPCode        string `json:"totp_code"` // temp!
}

type UpdateUserRequest struct {
	Email           *string `json:"email"`
	Password        *string `json:"password"`
	IsEmailVerified *bool   `json:"is_email_verified"`
}

type SafeUser struct {
	ID              int64  `json:"id"`
	Email           string `json:"email"`
	IsEmailVerified bool   `json:"is_email_verified"`
	IsTOTPEnabled   bool   `json:"is_totp_enabled"`
}

type EmailRequest struct {
	NewEmail string `json:"new_email"`
}

type PasswordRequest struct {
	CurrentPassword string `json:"current_password"`
	NewPassword     string `json:"new_password"`
}

type AuthAction string

const (
	AuthActionRegister AuthAction = "register"
	AuthActionLogin    AuthAction = "login"
)
