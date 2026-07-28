package models

// User stores ID for some important implementations, where we can't afford bugs due to username change.
type User struct {
	ID              int64  `json:"id"`
	Email           string `json:"email"`
	Password        string `json:"-"`
	IsEmailVerified string `json:"is_email_verified"`
}

type UserRequest struct {
	Email           string `json:"email"`
	Password        string `json:"password"`
	IsEmailVerified string `json:"is_email_verified"`
}

type UpdateUserRequest struct {
	Email           *string `json:"email"`
	Password        *string `json:"password"`
	IsEmailVerified *string `json:"is_email_verified"`
}

type SafeUser struct {
	ID              int64  `json:"id"`
	Email           string `json:"email"`
	IsEmailVerified string `json:"is_email_verified"`
}

type AuthAction string

const (
	AuthActionRegister AuthAction = "register"
	AuthActionLogin    AuthAction = "login"
)
