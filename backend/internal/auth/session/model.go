package session

import "time"

type Handler struct {
	Service *Service
}

type Session struct {
	ID        int64     `json:"id"`
	UserID    int64     `json:"user_id"`
	OS        string    `json:"os"`
	Browser   string    `json:"browser"`
	Device    string    `json:"device"`
	Country   string    `json:"country"`
	LastLogin time.Time `json:"last_login"`
	IsCurrent bool      `json:"is_current"`
}

// Input holds the client details taken from the request (User-Agent, GeoIP, etc.).
type Input struct {
	OS      string
	Browser string
	Device  string
	Country string
}
