package main

import (
	"net/http"
	"studify/internal/auth"
	"studify/internal/auth/emailconfirm"
	"studify/internal/auth/mfa"
	"studify/internal/auth/resetpassword"
	"studify/internal/dashboard"
	"studify/internal/middlewares"
	"studify/internal/subject"
	"studify/internal/task"
	"studify/internal/user"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/cors"
	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promhttp"
)

func newRouter(h *Handler, corsOrigins []string, reg *prometheus.Registry, m *Metrics) http.Handler {
	r := chi.NewRouter()

	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   corsOrigins,
		AllowedMethods:   []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Content-Type"},
		AllowCredentials: true,
		MaxAge:           300,
	}))
	r.Use(middlewares.RequestID)
	r.Use(middlewares.RequestLogger)
	r.Use(middlewares.Metrics(m.requestsTotal, m.requestsDuration))

	r.Handle("/metrics", promhttp.HandlerFor(reg, promhttp.HandlerOpts{}))

	validateAuth := middlewares.ValidateAuth(h.TokenManager)

	r.Route("/api", func(r chi.Router) {
		// Public
		r.Route("/auth", func(r chi.Router) {
			registerAuthRoutes(r, h.Auth)
			registerPasswordResetRoutes(r, h.ResetPassword)

		})

		// Auth needed
		r.Group(func(r chi.Router) {
			r.Use(validateAuth)

			r.Route("/auth", func(r chi.Router) {
				registerMfaRoutes(r, h.Mfa)
				registerEmailConfirmRoutes(r, h.EmailConfirm)
			})

			registerSubjectRoutes(r, h.Subject, h.Task)
			registerTaskRoutes(r, h.Task)
			registerUserRoutes(r, h.User)
			registerDashboardRoutes(r, h.Dashboard)
		})
	})

	r.Group(func(r chi.Router) {
		r.Use(validateAuth)
		registerStaticRoutes(r)
	})

	return r
}

func registerAuthRoutes(r chi.Router, h *auth.Handler) {
	r.Post("/logout", h.LogoutUser)
	//r.Post("/logout-full", h.LogoutAllSessions)
	//r.Post("/refresh", h.RefreshTokens)

	r.With(middlewares.RequireJSON).Post("/register", h.Register)
	//r.With(middlewares.RequireJSON).Post("/login", h.LoginUser)
	//r.With(middlewares.RequireJSON).Post("/login/totp", h.LoginTOTP)
}

func registerSubjectRoutes(r chi.Router, h *subject.Handler, t *task.Handler) {
	r.Route("/subjects", func(r chi.Router) {
		r.Get("/", h.GetUserSubjects)
		r.With(middlewares.RequireJSON).Post("/", h.AddSubject)
		r.Delete("/", h.DeleteUserSubjects)

		r.Route("/{id}", func(r chi.Router) {
			r.Get("/", h.GetSubject)
			r.Delete("/", h.DeleteSubject)
			r.With(middlewares.RequireJSON).Put("/", h.ReplaceSubject)
			r.With(middlewares.RequireJSON).Patch("/", h.UpdateSubject)

			r.Post("/thumbnail", h.UploadThumbnail)
			r.Post("/file", h.UploadFile)

			// Tasks
			r.Get("/tasks", t.GetSubjectTasks)
		})

	})
}

func registerTaskRoutes(r chi.Router, h *task.Handler) {
	r.Route("/tasks", func(r chi.Router) {
		r.With(middlewares.RequireJSON).Post("/", h.AddTask)

		r.Get("/{id}", h.GetTask)
		r.Delete("/{id}", h.DeleteTask)
		r.With(middlewares.RequireJSON).Put("/{id}", h.ReplaceTask)
		r.With(middlewares.RequireJSON).Patch("/{id}", h.UpdateTask)

		// Move to admin routes:
		r.Get("/", h.GetUserTasks)
		r.Delete("/", h.DeleteUserTasks)
	})
}

func registerUserRoutes(r chi.Router, h *user.Handler) {
	r.Route("/users", func(r chi.Router) {
		r.Route("/me", func(r chi.Router) {
			r.Get("/", h.GetUser)
			r.With(middlewares.RequireJSON).Patch("/email", h.UpdateEmail)
			r.With(middlewares.RequireJSON).Patch("/password", h.UpdatePassword)

			r.Route("/avatar", func(r chi.Router) {
				r.Post("/", h.UploadAvatar)
				r.Delete("/", h.DeleteAvatar)
			})
		})
	})
}

func registerDashboardRoutes(r chi.Router, h *dashboard.Handler) {
	r.Get("/dashboard", h.GetDashboardStatus)
}

func registerMfaRoutes(r chi.Router, h *mfa.Handler) {
	r.Route("/totp", func(r chi.Router) {
		r.Route("/setup", func(r chi.Router) {
			r.Post("/", h.GenerateTOTP)
			r.With(middlewares.RequireJSON).Post("/confirm", h.ConfirmTOTPSetup)
		})

		//r.With(middlewares.RequireJSON).Post("/verify", h.VerifyTOTP) // kinda useless, I made a mistake here; maybe in the future
		r.Delete("/", h.DisableTOTP)
	})
}

func registerPasswordResetRoutes(r chi.Router, h *resetpassword.Handler) {
	r.Route("/reset-password", func(r chi.Router) {
		r.Use(middlewares.RequireJSON)

		r.Post("/request", h.RequestPasswordReset)
		r.Post("/verify", h.VerifyResetPasswordToken)
		r.Post("/", h.ResetPassword)
	})
}

func registerEmailConfirmRoutes(r chi.Router, h *emailconfirm.Handler) {
	r.Route("/confirm", func(r chi.Router) {
		r.Post("/resend", h.ResendConfirmationMail)
		r.Post("/", h.ConfirmEmail)
	})
}

func registerStaticRoutes(r chi.Router) {
	fs := http.FileServer(http.Dir("data"))
	r.Get("/static/*", http.StripPrefix("/static/", fs).ServeHTTP)
}
