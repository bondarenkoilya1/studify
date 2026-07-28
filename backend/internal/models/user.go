package models

// User stores ID for some important implementations, where we can't afford bugs due to username change.
type User struct {
	ID       int64  `json:"id"`
	Email    string `json:"email"`
	Password string `json:"-"`
}

type UserRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type UpdateUserRequest struct {
	Email    *string `json:"email"`
	Password *string `json:"password"`
}

type SafeUser struct {
	ID    int64  `json:"id"`
	Email string `json:"email"`
}

type AuthAction string

const (
	AuthActionRegister AuthAction = "register"
	AuthActionLogin    AuthAction = "login"
)
