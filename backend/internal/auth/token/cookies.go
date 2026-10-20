package token

import (
	"net/http"
	"time"
)

const (
	accessCookieName  = "access_token"
	refreshCookieName = "refresh_token"
)

type Pair struct {
	Access  AccessToken
	Refresh RefreshToken
}

type Cookies struct {
	secure     bool
	accessTTL  time.Duration
	refreshTTL time.Duration
}

func NewCookies(secure bool, accessTTL, refreshTTL time.Duration) *Cookies {
	return &Cookies{
		secure:     secure,
		accessTTL:  accessTTL,
		refreshTTL: refreshTTL,
	}
}

// Set writes both cookies. Must be called before w.WriteHeader / http.Error.
func (c *Cookies) Set(w http.ResponseWriter, p Pair) {
	http.SetCookie(w, c.newCookie(accessCookieName, string(p.Access), int(c.accessTTL.Seconds())))
	http.SetCookie(w, c.newCookie(refreshCookieName, string(p.Refresh), int(c.refreshTTL.Seconds())))
}

// Clear tells the browser to delete both cookies.
func (c *Cookies) Clear(w http.ResponseWriter) {
	http.SetCookie(w, c.newCookie(accessCookieName, "", -1))
	http.SetCookie(w, c.newCookie(refreshCookieName, "", -1))
}

// RefreshToken reads the refresh token from the request.
// It returns http.ErrNoCookie if the cookie is absent.
func (c *Cookies) RefreshToken(r *http.Request) (RefreshToken, error) {
	cookie, err := r.Cookie(refreshCookieName)
	if err != nil {
		return "", err
	}

	return RefreshToken(cookie.Value), nil
}

func (c *Cookies) newCookie(name, value string, maxAge int) *http.Cookie {
	return &http.Cookie{
		Name:     name,
		Value:    value,
		Path:     "/",
		MaxAge:   maxAge,
		Secure:   c.secure,
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
	}
}
