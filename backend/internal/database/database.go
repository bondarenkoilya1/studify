package database

import (
	"database/sql"
	"fmt"
	"os"
	"time"

	_ "github.com/jackc/pgx/v5/stdlib"
)

func OpenDB() (*sql.DB, error) {
	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL == "" {
		databaseURL = "postgres://studify:studify@localhost:5432/studify?sslmode=disable"
	}

	db, err := sql.Open("pgx", databaseURL)
	if err != nil {
		return nil, err
	}

	var pingErr error
	for range 10 {
		if pingErr = db.Ping(); pingErr == nil {
			return db, nil
		}

		time.Sleep(time.Second)
	}

	db.Close()
	return nil, fmt.Errorf("connect to database: %w", pingErr)
}
