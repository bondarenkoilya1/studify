package main

import (
	"net/http"
	"strings"
	"studify/internal/auth"
	"studify/internal/auth/emailconfirm"
	"studify/internal/auth/mfa"
	"studify/internal/auth/resetpassword"
	"studify/internal/auth/session"
	"studify/internal/dashboard"
	"studify/internal/httpx"
	"studify/internal/media"
	"studify/internal/middlewares"
	"studify/internal/sharedproject"
	"studify/internal/subject"
	"studify/internal/task"
	"studify/internal/user"
	"time"

	"github.com/go-chi/chi/v5"
	chiMiddleware "github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promhttp"
)

func newRouter(h *Handler, corsOrigins []string, reg *prometheus.Registry, m *Metrics) http.Handler {
	r := chi.NewRouter()

	r.NotFound(func(w http.ResponseWriter, _ *http.Request) {
		httpx.WriteError(w, "route not found", http.StatusNotFound)
	})
	r.MethodNotAllowed(func(w http.ResponseWriter, req *http.Request) {
		var allowed []string
		for _, method := range []string{http.MethodGet, http.MethodHead, http.MethodPost, http.MethodPut,
			http.MethodPatch, http.MethodDelete, http.MethodOptions} {
			if r.Match(chi.NewRouteContext(), method, req.URL.EscapedPath()) {
				allowed = append(allowed, method)
			}
		}
		w.Header().Set("Allow", strings.Join(allowed, ", "))
		httpx.WriteError(w, "method not allowed", http.StatusMethodNotAllowed)
	})

	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   corsOrigins,
		AllowedMethods:   []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Content-Type"},
		ExposedHeaders:   []string{"Retry-After"},
		AllowCredentials: true,
		MaxAge:           300,
	}))
	r.Use(middlewares.RequestID)
	r.Use(middlewares.RequestLogger)
	r.Use(middlewares.Metrics(m.requestsTotal, m.requestsDuration))
	if len(h.Config.TrustedProxyCIDRs) > 0 {
		r.Use(chiMiddleware.ClientIPFromXFF(h.Config.TrustedProxyCIDRs...))
	} else {
		r.Use(chiMiddleware.ClientIPFromRemoteAddr)
	}
	limits := middlewares.NewAuthLimiter()

	if h.Config.MetricsAddr == "" {
		r.Get("/metrics", promhttp.HandlerFor(reg, promhttp.HandlerOpts{}).ServeHTTP)
	}

	validateAuth := middlewares.ValidateAuth(h.TokenManager, h.Session.Service)

	r.Route("/api", func(r chi.Router) {
		r.Route("/auth", func(r chi.Router) {
			// Public
			registerAuthRoutes(r, h.Auth, limits)
			registerPasswordResetRoutes(r, h.ResetPassword, limits)

			// Protected
			r.Group(func(r chi.Router) {
				r.Use(validateAuth)

				r.Post("/logout-all", h.Auth.LogoutAllSessions)
				registerMfaRoutes(r, h.Mfa, limits)
				registerEmailConfirmRoutes(r, h.EmailConfirm, limits)
				registerSessionRoutes(r, h.Session)
			})
		})

		r.Group(func(r chi.Router) {
			r.Use(validateAuth)

			registerSubjectRoutes(r, h.Subject, h.Task)
			registerTaskRoutes(r, h.Task)
			registerUserRoutes(r, h.User, limits)
			registerDashboardRoutes(r, h.Dashboard)
			r.Get("/calendar", h.Calendar.List)
			r.Route("/reminders/{target}/{id}", func(r chi.Router) {
				r.Get("/", h.Reminder.Get)
				r.With(middlewares.RequireJSON).Put("/", h.Reminder.Put)
				r.Delete("/", h.Reminder.Delete)
			})
			registerSharedProjectRoutes(r, h.SharedProjectHandler)
		})
	})

	r.Group(func(r chi.Router) {
		r.Use(validateAuth)
		registerStaticRoutes(r, h.Subject)
	})

	return r
}

func registerAuthRoutes(r chi.Router, h *auth.Handler, limits *middlewares.AuthLimiter) {
	r.Get("/session", h.CheckSession)
	r.Post("/logout", h.LogoutUser)
	r.Post("/refresh", h.RefreshTokens)

	r.With(limits.ByIP("register", 8, 15*time.Minute), middlewares.RequireJSON,
		limits.ByJSONField("register", "email", 3, 15*time.Minute)).Post("/register", h.Register)
	r.With(limits.ByIP("login", 30, time.Minute), middlewares.RequireJSON,
		limits.ByJSONField("login", "email", 10, time.Minute)).Post("/login", h.LoginUser)
	r.With(limits.ByIP("mfa-login", 30, time.Minute), middlewares.RequireJSON,
		limits.ByJSONField("mfa-login", "challenge_token", 5, 2*time.Minute)).Post("/login/totp", h.LoginTOTP)
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

func registerUserRoutes(r chi.Router, h *user.Handler, limits *middlewares.AuthLimiter) {
	r.Route("/users", func(r chi.Router) {
		r.Route("/me", func(r chi.Router) {
			r.Get("/", h.GetUser)
			r.With(limits.ByAccount("change-email", 5, time.Minute), middlewares.RequireJSON).Patch("/email", h.UpdateEmail)
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
	r.Get("/dashboard/plan", h.GetStudyPlan)
}

func registerMfaRoutes(r chi.Router, h *mfa.Handler, limits *middlewares.AuthLimiter) {
	r.Route("/totp", func(r chi.Router) {
		r.Route("/setup", func(r chi.Router) {
			r.Post("/", h.GenerateTOTP)
			r.With(middlewares.RequireJSON).Post("/confirm", h.ConfirmTOTPSetup)
		})

		r.With(middlewares.RequireJSON).Post("/recovery-codes", h.RegenerateRecoveryCodes)
		r.With(limits.ByAccount("disable-mfa", 5, time.Minute), middlewares.RequireJSON).Delete("/", h.DisableTOTP)
	})
}

func registerPasswordResetRoutes(r chi.Router, h *resetpassword.Handler, limits *middlewares.AuthLimiter) {
	r.Route("/reset-password", func(r chi.Router) {
		r.With(limits.ByIP("reset-mail", 10, 15*time.Minute), middlewares.RequireJSON,
			limits.ByJSONField("reset-mail", "email", 3, 15*time.Minute)).Post("/request", h.RequestPasswordReset)
		r.With(limits.ByIP("reset-token", 30, 5*time.Minute), middlewares.RequireJSON).Post("/verify", h.VerifyResetPasswordToken)
		r.With(limits.ByIP("reset-token", 30, 5*time.Minute), middlewares.RequireJSON).Post("/", h.ResetPassword)
	})
}

func registerEmailConfirmRoutes(r chi.Router, h *emailconfirm.Handler, limits *middlewares.AuthLimiter) {
	r.Route("/confirm", func(r chi.Router) {
		r.With(limits.ByIP("confirm-resend", 10, 15*time.Minute),
			limits.ByAccount("confirm-resend", 3, 15*time.Minute)).Post("/resend", h.ResendConfirmationMail)
		r.With(middlewares.RequireJSON).Post("/", h.ConfirmEmail)
	})
}

func registerSessionRoutes(r chi.Router, h *session.Handler) {
	r.Route("/sessions", func(r chi.Router) {
		r.Get("/", h.GetUserSessions)
		r.Delete("/", h.RevokeAllSessions)

		r.Route("/{id}", func(r chi.Router) {
			r.Get("/", h.GetSession)
			r.Delete("/", h.RevokeSession)
		})
	})
}

func registerStaticRoutes(r chi.Router, h *subject.Handler) {
	r.Get("/static/files/{filename}", h.DownloadFile)
	r.Get("/static/users/{filename}", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Cache-Control", "private, no-store")
		media.ServeStoredFile(w, r, "data/users", chi.URLParam(r, "filename"))
	})
	r.Get("/static/thumbnails/{filename}", h.DownloadThumbnail)
}

func registerSharedProjectRoutes(r chi.Router, h *sharedproject.Handler) {
	r.Route("/shared-projects", func(r chi.Router) {
		r.Get("/", h.GetUserProjects)
		r.Get("/catalog", h.GetCatalog)
		r.With(middlewares.RequireJSON).Post("/", h.Create)

		r.Route("/{id}", func(r chi.Router) {
			r.Get("/", h.GetByID)
			r.Delete("/", h.Delete)
			r.With(middlewares.RequireJSON).Put("/", h.Update)
		})
	})
}
