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
	IsPublic        bool   `json:"is_public"`
}

type CatalogPage struct {
	Items      []SharedProject `json:"items"`
	NextBefore *int64          `json:"next_before"`
}

type createSharedProjectInput struct {
	UserID          int64
	Name            string
	URL             string
	Author          string
	AuthorAvatarURL string
	IsPublic        *bool
}

type updateSharedProjectInput struct {
	UserID          int64
	ID              int64
	Name            string
	URL             string
	Author          string
	AuthorAvatarURL string
	IsPublic        *bool
}

type sharedProjectRequest struct {
	Name            string `json:"name"`
	URL             string `json:"url"`
	Author          string `json:"author"`
	AuthorAvatarURL string `json:"author_avatar_url"`
	IsPublic        *bool  `json:"is_public"`
}
