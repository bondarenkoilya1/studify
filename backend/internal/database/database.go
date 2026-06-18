package database

import (
	"database/sql"
	"fmt"
	"time"

	_ "github.com/jackc/pgx/v5/stdlib"
)

func OpenDB(databaseURL string) (*sql.DB, error) {
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
