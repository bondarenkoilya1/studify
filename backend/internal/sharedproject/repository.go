package sharedproject

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"studify/internal"

	"github.com/jackc/pgx/v5/pgconn"
)

func scanSharedProject(scanner interface{ Scan(dest ...any) error }) (*SharedProject, error) {
	p := &SharedProject{}
	if err := scanner.Scan(&p.ID, &p.UserID, &p.Name, &p.URL, &p.Author, &p.AuthorAvatarURL, &p.IsPublic); err != nil {
		return nil, err
	}
	return p, nil
}

func InsertSharedProject(db internal.DBTX, userID int64, name, url, author, authorAvatarURL string, isPublic *bool) (*SharedProject, error) {
	const query = `
		INSERT INTO shared_projects (user_id, name, url, author, author_avatar_url, is_public)
		VALUES ($1, $2, $3, $4, $5, COALESCE($6, false))
		RETURNING id, user_id, name, url, author, author_avatar_url, is_public;
	`

	p, err := scanSharedProject(db.QueryRow(query, userID, name, url, author, authorAvatarURL, isPublic))
	if err != nil {
		return nil, fmt.Errorf("insert shared project: %w", normalizeUniqueSharedProjectError(err))
	}
	return p, nil
}

func GetSharedProjectByID(db internal.DBTX, id, userID int64) (*SharedProject, error) {
	const query = `
		SELECT id, user_id, name, url, author, author_avatar_url, is_public
		FROM shared_projects WHERE id = $1 AND (is_public OR user_id = $2);
	`

	p, err := scanSharedProject(db.QueryRow(query, id, userID))
	if err != nil {
		return nil, fmt.Errorf("get shared project by id: %w", err)
	}
	return p, nil
}

func GetSharedProjectsByUserID(db internal.DBTX, userID int64) ([]SharedProject, error) {
	const query = `
       SELECT id, user_id, name, url, author, author_avatar_url, is_public
       FROM shared_projects
       WHERE user_id = $1
       ORDER BY id DESC;
    `

	rows, err := db.Query(query, userID)
	if err != nil {
		return nil, fmt.Errorf("get shared projects by user id: %w", err)
	}
	return scanSharedProjects(rows)
}

func GetPublicSharedProjects(ctx context.Context, db internal.DBTX, before int64, limit int) ([]SharedProject, error) {
	const query = `
		SELECT id, user_id, name, url, author, author_avatar_url, is_public
		FROM shared_projects
		WHERE is_public AND ($1 = 0 OR id < $1)
		ORDER BY id DESC LIMIT $2;`
	rows, err := db.QueryContext(ctx, query, before, limit)
	if err != nil {
		return nil, fmt.Errorf("get project catalog: %w", err)
	}
	return scanSharedProjects(rows)
}

func scanSharedProjects(rows *sql.Rows) ([]SharedProject, error) {
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

func UpdateSharedProject(db internal.DBTX, userID, id int64, name, url, author, authorAvatarURL string, isPublic *bool) (*SharedProject, error) {
	const query = `
		UPDATE shared_projects
		SET name = $1, url = $2, author = $3, author_avatar_url = $4, is_public = COALESCE($7, is_public)
		WHERE id = $5 AND user_id = $6
		RETURNING id, user_id, name, url, author, author_avatar_url, is_public;
	`

	project, err := scanSharedProject(db.QueryRow(query, name, url, author, authorAvatarURL, id, userID, isPublic))
	if err != nil {
		return nil, fmt.Errorf("update shared project: %w", normalizeUniqueSharedProjectError(err))
	}
	return project, nil
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
