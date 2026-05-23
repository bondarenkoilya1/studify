package main

import (
	"log"
	"net/http"
	"studify/database"
	"studify/handlers"

	"github.com/go-chi/chi/v5"
)

func main() {
	db, err := database.OpenDB()
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	if err = database.CreateTables(db); err != nil {
		log.Fatal(err)
	}

	h := &handlers.Handler{DB: db}

	r := chi.NewRouter()
	r.Route("/subjects", func(r chi.Router) {
		r.Get("/", h.GetSubjects)
		r.Post("/", h.AddSubjects)
		r.Delete("/", h.DeleteSubjects)

		r.Get("/{id}", h.GetSubject)
		r.Delete("/{id}", h.DeleteSubject)
		r.Put("/{id}", h.ReplaceSubject)
	})

	r.Route("/tasks", func(r chi.Router) {
		r.Get("/", handlers.GetTasks)
		r.Post("/", handlers.AddTasks)
		r.Delete("/", handlers.DeleteTasks)

		r.Get("/{id}", h.GetTask)
		r.Delete("/{id}", handlers.DeleteTask)
		r.Put("/{id}", handlers.ReplaceTask)
	})

	log.Fatal(http.ListenAndServe(":8080", r))
}

/* TODO:
- Validate data
- Refactor some code from subjects files
- Write patch methods
- Add logger middleware
*/
