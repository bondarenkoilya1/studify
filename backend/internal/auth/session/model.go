package session

import "time"

type Session struct {
	ID        int64
	UserID    int64
	OS        string
	Browser   string
	Device    string
	Country   string
	LastLogin time.Time
}
