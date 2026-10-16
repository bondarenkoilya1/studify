package resetpassword

type email struct {
	Email string `json:"email"`
}

type changePasswordRequest struct {
	Token                string `json:"password_reset_token"`
	NewPassword          string `json:"new_password"`
	NewPasswordConfirmed string `json:"new_password_confirmed"`
}

type tokenResponse struct {
	Token string `json:"password_reset_token"`
}

type Handler struct {
	ResetPasswordService *Service
}
