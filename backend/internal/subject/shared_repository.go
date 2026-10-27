package subject

import (
	"database/sql"
	"errors"
	"fmt"
	"studify/internal"

	"github.com/jackc/pgx/v5/pgconn"
)

var ErrSharedProjectAlreadyExists = errors.New("shared project already exists")

type SharedProject struct {
	ID              int64  `json:"id"`
	UserID          int64  `json:"user_id"`
	Name            string `json:"name"`
	URL             string `json:"url"`
	Author          string `json:"author"`
	AuthorAvatarURL string `json:"author_avatar_url"`
}

func scanSharedProject(scanner interface{ Scan(dest ...any) error }) (*SharedProject, error) {
	p := &SharedProject{}
	if err := scanner.Scan(&p.ID, &p.UserID, &p.Name, &p.URL, &p.Author, &p.AuthorAvatarURL); err != nil {
		return nil, err
	}
	return p, nil
}

func InsertSharedProject(db internal.DBTX, userID int64, name, url, author, authorAvatarURL string) (*SharedProject, error) {
	const query = `
		INSERT INTO shared_projects (user_id, name, url, author, author_avatar_url)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id, user_id, name, url, author, author_avatar_url;
	`

	p, err := scanSharedProject(db.QueryRow(query, userID, name, url, author, authorAvatarURL))
	if err != nil {
		return nil, fmt.Errorf("insert shared project: %w", normalizeUniqueSharedProjectError(err))
	}
	return p, nil
}

func GetSharedProjectByID(db internal.DBTX, id int64) (*SharedProject, error) {
	const query = `
		SELECT id, user_id, name, url, author, author_avatar_url
		FROM shared_projects WHERE id = $1;
	`

	p, err := scanSharedProject(db.QueryRow(query, id))
	if err != nil {
		return nil, fmt.Errorf("get shared project by id: %w", err)
	}
	return p, nil
}

func GetSharedProjects(db internal.DBTX) ([]SharedProject, error) {
	const query = `
		SELECT id, user_id, name, url, author, author_avatar_url
		FROM shared_projects
		ORDER BY id DESC;
	`

	rows, err := db.Query(query)
	if err != nil {
		return nil, fmt.Errorf("get shared projects: %w", err)
	}
	defer rows.Close()

	projects := make([]SharedProject, 0)
	for rows.Next() {
		p, err := scanSharedProject(rows)
		if err != nil {
			return nil, fmt.Errorf("scan shared project: %w", err)
		}
		projects = append(projects, *p)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("read shared projects rows: %w", err)
	}

	return projects, nil
}

func UpdateSharedProject(db internal.DBTX, userID, id int64, name, url, author, authorAvatarURL string) error {
	const query = `
		UPDATE shared_projects
		SET name = $1, url = $2, author = $3, author_avatar_url = $4
		WHERE id = $5 AND user_id = $6;
	`

	result, err := db.Exec(query, name, url, author, authorAvatarURL, id, userID)
	if err != nil {
		return fmt.Errorf("update shared project: %w", normalizeUniqueSharedProjectError(err))
	}

	n, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("get updated shared project count: %w", err)
	}
	if n == 0 {
		return sql.ErrNoRows
	}

	return nil
}

func DeleteSharedProjectByID(db internal.DBTX, userID, id int64) error {
	result, err := db.Exec(`DELETE FROM shared_projects WHERE id = $1 AND user_id = $2;`, id, userID)
	if err != nil {
		return fmt.Errorf("delete shared project: %w", err)
	}

	n, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("get deleted shared project count: %w", err)
	}
	if n == 0 {
		return sql.ErrNoRows
	}

	return nil
}

func normalizeUniqueSharedProjectError(err error) error {
	if err == nil {
		return nil
	}
	if pgErr, ok := errors.AsType[*pgconn.PgError](err); ok && pgErr.Code == "23505" {
		return ErrSharedProjectAlreadyExists
	}
	return err
}
