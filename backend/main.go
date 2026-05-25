package main

import (
	"log"
	"net/http"
	"studify/database"
	"studify/handlers"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
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
	r.Use(middleware.Logger)
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins: []string{
			"http://localhost:5173",
			"http://localhost:3000",
		},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Content-Type"},
		AllowCredentials: false,
		MaxAge:           300,
	}))

	r.Route("/subjects", func(r chi.Router) {
		r.Get("/", h.GetSubjects)
		r.Post("/", h.AddSubjects)
		r.Delete("/", h.DeleteSubjects)

		r.Get("/{id}", h.GetSubject)
		r.Delete("/{id}", h.DeleteSubject)
		r.Put("/{id}", h.ReplaceSubject)
	})

	r.Route("/tasks", func(r chi.Router) {
		r.Get("/", h.GetTasks)
		r.Post("/", h.AddTasks)
		r.Delete("/", h.DeleteTasks)

		r.Get("/{id}", h.GetTask)
		r.Delete("/{id}", h.DeleteTask)
		r.Put("/{id}", h.ReplaceTask)
	})

	r.Route("/dashboard", func(r chi.Router) {
		r.Get("/status", h.GetDashboardStatus)
	})

	log.Fatal(http.ListenAndServe(":8080", r))
}

/* TODO:
- Validate data
- Write patch methods
*/
