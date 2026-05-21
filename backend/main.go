package main

import (
	"log"
	"net/http"

	"github.com/go-chi/chi/v5"
)

func main() {
	r := chi.NewRouter()
	r.Route("/subjects", func(r chi.Router) {
		r.Get("/", GetSubjects)
		r.Post("/", AddSubjects)
		r.Delete("/", DeleteSubjects)

		r.Get("/{id}", GetSubject)
		r.Delete("/{id}", DeleteSubject)
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

// TODO: validate data
// ? I use PATCH, PUT only for specified entity. Not all of them
