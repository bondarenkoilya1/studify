package models

// User stores ID for some important implementations, where we can't afford bugs due to username change.
// Otherwise, I use username, e.g. for displaying at the URL path
type User struct {
	ID       int64  `json:"id"`
	Username string `json:"username"`
	Password string `json:"-"`
}

type UserRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

type UpdateUserRequest struct {
	Username *string `json:"username"`
	Password *string `json:"password"`
}

type SafeUser struct {
	ID       int64  `json:"id"`
	Username string `json:"username"`
}

type AuthAction string

const (
	AuthActionRegister AuthAction = "register"
	AuthActionLogin    AuthAction = "login"
)
