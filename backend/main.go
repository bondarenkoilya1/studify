package main

import (
	"database/sql"
	"log"
	"net/http"

	"studify/database"

	"github.com/go-chi/chi/v5"
)

type Handler struct {
	DB *sql.DB
}

func main() {
	db, err := database.OpenDB()
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	if err = database.CreateSubjectsTable(db); err != nil {
		log.Fatal(err)
	}

	h := &Handler{DB: db}

	r := chi.NewRouter()
	r.Route("/subjects", func(r chi.Router) {
		r.Get("/", h.GetSubjects)
		r.Post("/", AddSubjects)
		r.Delete("/", DeleteSubjects)

		r.Get("/{id}", h.GetSubject)
		r.Delete("/{id}", h.DeleteSubject)
		r.Put("/{id}", ReplaceSubject)
	})

	r.Route("/tasks", func(r chi.Router) {
		r.Get("/", GetTasks)
		r.Post("/", AddTasks)
		r.Delete("/", DeleteTasks)

		r.Get("/{id}", GetTask)
		r.Delete("/{id}", DeleteTask)
		r.Put("/{id}", ReplaceTask)
	})

	log.Fatal(http.ListenAndServe(":8080", r))
}

/* TODO:
- Validate data
- Refactor some code from subjects files
- Write patch methods
- Add logger middleware
*/
