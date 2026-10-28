package sharedproject

import (
	"database/sql"
)

type Service struct {
	db *sql.DB
}

type SharedProject struct {
	ID              int64  `json:"id"`
	UserID          int64  `json:"user_id"`
	Name            string `json:"name"`
	URL             string `json:"url"`
	Author          string `json:"author"`
	AuthorAvatarURL string `json:"author_avatar_url"`
}

type createSharedProjectInput struct {
	UserID          int64
	Name            string
	URL             string
	Author          string
	AuthorAvatarURL string
}

type updateSharedProjectInput struct {
	UserID          int64
	ID              int64
	Name            string
	URL             string
	Author          string
	AuthorAvatarURL string
}

type sharedProjectRequest struct {
	Name            string `json:"name"`
	URL             string `json:"url"`
	Author          string `json:"author"`
	AuthorAvatarURL string `json:"author_avatar_url"`
}
