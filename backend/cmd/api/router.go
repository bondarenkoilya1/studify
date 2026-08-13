package main

import (
	"net/http"
	"studify/internal/auth/mfa"
	"studify/internal/dashboard"
	"studify/internal/handlers"
	"studify/internal/middlewares"
	"studify/internal/subject"
	"studify/internal/task"
	"studify/internal/user"

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

		r.Group(func(r chi.Router) {
			r.Use(middlewares.ValidateAuth(h.Auth))

			registerSubjectRoutes(r, h.Subject)
			registerTaskRoutes(r, h.Task)
			registerUserRoutes(r, h.User)
			registerDashboardRoutes(r, h.Dashboard)
		})
	})

	//registerStaticRoutes(r)

	return r
}

func registerAuthRoutes(r chi.Router, h *handlers.Handler) {
	r.Route("/auth", func(r chi.Router) {
		r.Post("/logout", h.LogoutUser)

		r.With(middlewares.RequireJSON).Post("/register", h.RegisterUser)
		r.With(middlewares.RequireJSON).Post("/login", h.LoginUser)
		r.With(middlewares.RequireJSON).Post("/login/totp", h.LoginTOTP)
		r.Post("/refresh", h.RefreshTokens)

		registerMfaRoutes(r, h.Mfa)

		r.Route("/confirm", func(r chi.Router) {
			r.Use(middlewares.ValidateAuth(h.Auth))
			r.Post("/resend", h.ResendConfirmationMail)
			r.Post("/{token}", h.ConfirmEmail)
		})
	})
}

func registerSubjectRoutes(r chi.Router, h *subject.Handler) {
	r.Route("/subjects", func(r chi.Router) {
		r.Get("/", h.GetSubjects)
		r.With(middlewares.RequireJSON).Post("/", h.AddSubject)
		r.Delete("/", h.DeleteSubjects)

		r.Get("/{id}", h.GetSubject)
		r.Delete("/{id}", h.DeleteSubject)
		r.With(middlewares.RequireJSON).Put("/{id}", h.ReplaceSubject)
		r.With(middlewares.RequireJSON).Patch("/{id}", h.UpdateSubject)

		r.Post("/avatar/", h.UploadLecturerAvatar)
	})
}

func registerTaskRoutes(r chi.Router, h *task.Handler) {
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

func registerUserRoutes(r chi.Router, h *user.Handler) {
	r.Route("/users", func(r chi.Router) {
		r.Route("/me", func(r chi.Router) {
			r.Get("/", h.GetUser)
			r.With(middlewares.RequireJSON).Patch("/email", h.UpdateUserEmail)
			r.With(middlewares.RequireJSON).Patch("/password", h.UpdateUserPassword)
		})
	})
}

func registerDashboardRoutes(r chi.Router, h *dashboard.Handler) {
	r.Get("/dashboard", h.GetDashboardStatus)
}

func registerMfaRoutes(r chi.Router, h *mfa.Handler) {
	r.Route("/totp", func(r chi.Router) {
		r.Use(middlewares.ValidateAuth(h.Auth))

		r.Route("/setup", func(r chi.Router) {
			r.Post("/", h.GenerateTOTP)
			r.With(middlewares.RequireJSON).Post("/confirm", h.ConfirmTOTPSetup)
		})

		//r.With(middlewares.RequireJSON).Post("/verify", h.VerifyTOTP) // kinda useless, i made a mistake here; maybe in the future
		r.Delete("/", h.DisableTOTP)
	})
}

//func registerStaticRoutes(r chi.Router) {
//	lecturerAvatarFiles := http.FileServer(http.Dir("./data/lecturer-avatars"))
//	r.Handle("/static/lecturer-avatars/*", http.StripPrefix("/static/lecturer-avatars/", lecturerAvatarFiles))
//}
