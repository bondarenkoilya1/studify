package main

import (
	"log"
	"net/http"
	"studify/internal/config"
	"studify/internal/database"
	"studify/internal/handlers"
	"studify/internal/middlewares"
	"studify/internal/utils"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatal(err)
	}

	db, err := database.OpenDB(cfg.DatabaseURL)
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	auth := utils.NewAuthService(cfg.JWTAccessSecret, cfg.JWTRefreshSecret, cfg.Issuer)
	h := &handlers.Handler{DB: db, Auth: auth}

	r := chi.NewRouter()
	r.Use(middleware.Logger)
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins: []string{
			"http://localhost:5173",
			"http://localhost:3000",
		},
		AllowedMethods:   []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Content-Type"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	r.Route("/", func(r chi.Router) {
		r.With(middlewares.RequireJSON).Post("/register", h.RegisterUser)
		r.With(middlewares.RequireJSON).Post("/login", h.LoginUser)

		r.Group(func(r chi.Router) {
			r.Use(middlewares.ValidateAuth(auth))

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

			r.Route("/users", func(r chi.Router) {
				r.Get("/", h.GetUsers)
				r.Delete("/", h.DeleteUsers)

				r.Delete("/{username}", h.DeleteUser)
				r.With(middlewares.RequireJSON).Put("/{username}", h.ReplaceUser)
				r.With(middlewares.RequireJSON).Patch("/{username}", h.UpdateUser)
			})

			r.Post("/logout", h.LogoutUser)
		})
	})

	lecturerAvatarFiles := http.FileServer(http.Dir("./data/lecturer-avatars"))
	r.Handle("/static/lecturer-avatars/*", http.StripPrefix("/static/lecturer-avatars/", lecturerAvatarFiles))

	log.Fatal(http.ListenAndServe(cfg.ServerAddr, r))
}

/* Later:
- Use JOIN methods for connecting tasks with their subjects
- Allow to upload avatar for the lecturer
- Allow to set description for the task
- Allow to set the file with the task
- Add calendar where you ca click on date an assign task

- Convert all avatars to WebP
*/
