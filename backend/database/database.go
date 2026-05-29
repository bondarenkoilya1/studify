package database

import (
	"database/sql"

	_ "modernc.org/sqlite"
)

func OpenDB() (*sql.DB, error) {
	db, err := sql.Open("sqlite", "./data/studify.db")
	if err != nil {
		return nil, err
	}

	if err = db.Ping(); err != nil {
		db.Close()
		return nil, err
	}

	if _, err = db.Exec("PRAGMA foreign_keys = ON;"); err != nil {
		db.Close()
		return nil, err
	}

	return db, nil
}

func CreateTables(db *sql.DB) error {
	query := `
	CREATE TABLE IF NOT EXISTS subjects (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		name TEXT NOT NULL,
		lecturer TEXT,
		exam_date TEXT
	);
`

	_, err := db.Exec(query)
	if err != nil {
		return err
	}

	query = `
	CREATE TABLE IF NOT EXISTS tasks (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		name TEXT NOT NULL,
		deadline TEXT,
		status TEXT NOT NULL,
		subject_id INTEGER NOT NULL,

		FOREIGN KEY (subject_id) REFERENCES subjects(id)
	);
`

	_, err = db.Exec(query)
	return err
}
