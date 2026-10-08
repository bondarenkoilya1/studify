package mail

import "strings"

const (
	confirmationSubject = "Studify | Confirm your account"
	confirmationBody    = `Hi,

You're receiving this email because your email address was used to register at Studify.

Please click the following link: %s
`

	passwordResetSubject = "Studify | Reset your password"
	passwordResetBody    = `Hi,

We received a request to reset the password for your Studify account.

If you made this request, use the link below to choose a new password:

%s

This link will expire in 30 minutes and can only be used once.

If you didn't request a password reset, you can safely ignore this email. Your password will not be changed unless the reset link is used.

For your security, never share this link or your password with anyone. Studify will never ask you to send us your password.

Best,
The Studify Team
`

	newPasswordSubject = "Studify | Your new password"
	newPasswordBody    = `Hi,

Your Studify password has been changed.

Your new password is:

%s

You can use this password to sign in to your Studify account.

If you didn't make this change, please reset your password immediately and contact us if you need help.

For your security, don't share your password with anyone.

Best,
The Studify Team
`
)

func buildMessage(sender, recipient, subject, body string) string {
	var b strings.Builder

	b.WriteString("From: <" + sender + ">\r\n")
	b.WriteString("To: " + recipient + "\r\n")
	b.WriteString("Subject: " + subject + "\r\n")
	b.WriteString("MIME-Version: 1.0\r\n")
	b.WriteString("Content-Type: text/plain; charset=UTF-8\r\n")
	b.WriteString("\r\n") // пустая строка отделяет заголовки от тела

	b.WriteString(strings.ReplaceAll(body, "\n", "\r\n"))

	return b.String()
}
