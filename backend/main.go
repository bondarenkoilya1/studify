package main

import (
	"log"
	"net/http"

	"studify/database"

	"github.com/go-chi/chi/v5"
)

func main() {
	db, err := database.OpenDB()
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	if err = database.CreateSubjectsTable(db); err != nil {
		log.Fatal(err)
	}

	r := chi.NewRouter()
	r.Route("/subjects", func(r chi.Router) {
		r.Get("/", GetSubjects)
		r.Post("/", AddSubjects)
		r.Delete("/", DeleteSubjects)

		r.Get("/{id}", GetSubject)
		r.Delete("/{id}", DeleteSubject)
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
