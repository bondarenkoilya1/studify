package main

import (
	"net/http"
	"studify/internal/handlers"
	"studify/internal/middlewares"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
)

func newRouter(h *handlers.Handler, corsOrigins []string) http.Handler {
	r := chi.NewRouter()

	r.Use(middleware.Logger)
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   corsOrigins,
		AllowedMethods:   []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Content-Type"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	r.Route("/api", func(r chi.Router) {
		registerAuthRoutes(r, h)
		r.Post("/logout", h.LogoutUser)

		r.Group(func(r chi.Router) {
			r.Use(middlewares.ValidateAuth(h.Auth))

			registerSubjectRoutes(r, h)
			registerTaskRoutes(r, h)
			registerUserRoutes(r, h)

			r.Get("/dashboard", h.GetDashboardStatus)
		})
	})

	registerStaticRoutes(r)

	return r
}

func registerAuthRoutes(r chi.Router, h *handlers.Handler) {
	r.Route("/auth", func(r chi.Router) {
		r.With(middlewares.RequireJSON).Post("/register", h.RegisterUser)
		r.With(middlewares.RequireJSON).Post("/login", h.LoginUser)
		r.Post("/refresh", h.RefreshTokens)
		r.With(middlewares.ValidateAuth(h.Auth)).Get("/me", h.GetCurrentUser)

		r.Route("/confirmation", func(r chi.Router) {
			r.With(middlewares.ValidateAuth(h.Auth)).Post("/resend", h.ResendConfirmationMail)
			r.Get("/{token}", h.ConfirmMail)
		})
	})
}

func registerSubjectRoutes(r chi.Router, h *handlers.Handler) {
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
}

func registerTaskRoutes(r chi.Router, h *handlers.Handler) {
	r.Route("/tasks", func(r chi.Router) {
		r.Get("/", h.GetTasks)
		r.With(middlewares.RequireJSON).Post("/", h.AddTasks)
		r.Delete("/", h.DeleteTasks)

		r.Get("/{id}", h.GetTask)
		r.Delete("/{id}", h.DeleteTask)
		r.With(middlewares.RequireJSON).Put("/{id}", h.ReplaceTask)
		r.With(middlewares.RequireJSON).Patch("/{id}", h.UpdateTask)
	})
}

func registerUserRoutes(r chi.Router, h *handlers.Handler) {
	r.Route("/users", func(r chi.Router) {
		r.Get("/", h.GetUsers)
		r.Delete("/", h.DeleteUsers)

		r.Delete("/{username}", h.DeleteUser)
		r.With(middlewares.RequireJSON).Put("/{username}", h.ReplaceUser)
		r.With(middlewares.RequireJSON).Patch("/{username}", h.UpdateUser)
	})
}

func registerStaticRoutes(r chi.Router) {
	lecturerAvatarFiles := http.FileServer(http.Dir("./data/lecturer-avatars"))
	r.Handle("/static/lecturer-avatars/*", http.StripPrefix("/static/lecturer-avatars/", lecturerAvatarFiles))
}
