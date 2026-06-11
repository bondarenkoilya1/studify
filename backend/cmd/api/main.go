package main

import (
	"log"
	"net/http"
	"studify/internal/database"
	"studify/internal/handlers"
	"studify/internal/middlewares"

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

	h := &handlers.Handler{DB: db}

	r := chi.NewRouter()
	r.Use(middleware.Logger)
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins: []string{
			"http://localhost:5173",
			"http://localhost:3000",
		},
		AllowedMethods:   []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Content-Type"},
		AllowCredentials: false,
		MaxAge:           300,
	}))

	r.Route("/subjects", func(r chi.Router) {
		r.Get("/", h.GetSubjects)
		r.With(middlewares.RequireJSON).Post("/", h.AddSubjects)
		r.Delete("/", h.DeleteSubjects)

		r.Get("/{id}", h.GetSubject)
		r.Delete("/{id}", h.DeleteSubject)
		r.With(middlewares.RequireJSON).Put("/{id}", h.ReplaceSubject)
		r.With(middlewares.RequireJSON).Patch("/{id}", h.UpdateSubject)

		r.Post("/avatar/", h.UploadLecturerAvatar)
	})

	r.Route("/tasks", func(r chi.Router) {
		r.Get("/", h.GetTasks)
		r.With(middlewares.RequireJSON).Post("/", h.AddTasks)
		r.Delete("/", h.DeleteTasks)

		r.Get("/{id}", h.GetTask)
		r.Delete("/{id}", h.DeleteTask)
		r.With(middlewares.RequireJSON).Put("/{id}", h.ReplaceTask)
		r.With(middlewares.RequireJSON).Patch("/{id}", h.UpdateTask)
	})

	r.Get("/dashboard", h.GetDashboardStatus)

	r.With(middlewares.RequireJSON).Post("/register/", h.RegisterUser)
	r.With(middlewares.RequireJSON).Post("/login/", h.LoginUser)

	lecturerAvatarFiles := http.FileServer(http.Dir("./data/lecturer-avatars"))
	r.Handle("/static/lecturer-avatars/*", http.StripPrefix("/static/lecturer-avatars/", lecturerAvatarFiles))

	log.Fatal(http.ListenAndServe(":8080", r))
}

/* Later:
- Validate data
- Use JOIN methods for connectins tasks with it's subject
- Allow to upload avatar for the lecturer
- Allow to set description for the task
- Allow to set the file with the task
- Add calendar where you ca click on date an assign task

- Convert all avatars to WebP
*/
