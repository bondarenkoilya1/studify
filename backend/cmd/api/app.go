package main

import (
	"database/sql"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"studify/internal/auth/emailconfirm"
	"studify/internal/sharedproject"
	"time"

	_ "github.com/jackc/pgx/v5/stdlib"
	"github.com/lmittmann/tint"
	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/collectors"
	"github.com/prometheus/client_golang/prometheus/promauto"

	"studify/internal/auth"
	"studify/internal/auth/mfa"
	"studify/internal/auth/resetpassword"
	"studify/internal/auth/token"
	"studify/internal/config"
	"studify/internal/dashboard"
	"studify/internal/mail"
	"studify/internal/subject"
	"studify/internal/task"
	"studify/internal/user"
)

type application struct {
	addr   string
	db     *sql.DB
	router http.Handler
}

// TODO
// #1. Rename all Handler from Auth -> AuthHandler, .etc
// #2. Rename own package services from AuthService -> to Service. (Inside packages)

// Handler holds all handlers and services needed by the router.
type Handler struct {
	Config               *config.Config
	TokenManager         *token.Manager
	MailService          *mail.Service
	Auth                 *auth.Handler
	User                 *user.Handler
	UserService          *user.Service
	Mfa                  *mfa.Handler
	MfaService           *mfa.Service
	ResetPassword        *resetpassword.Handler
	ResetPasswordService *resetpassword.Service
	EmailConfirm         *emailconfirm.Handler
	EmailConfirmService  *emailconfirm.Service
	Subject              *subject.Handler
	Task                 *task.Handler
	Dashboard            *dashboard.Handler
	SharedProjectHandler *sharedproject.Handler
}

type Metrics struct {
	requestsTotal    *prometheus.CounterVec
	requestsDuration *prometheus.HistogramVec
}

func run() error {
	initLogger()
	reg, m := initPrometheus()

	app, err := newApplication(reg, m)
	if err != nil {
		return err
	}
	defer app.close()

	return http.ListenAndServe(app.addr, app.router)
}

func newApplication(reg *prometheus.Registry, m *Metrics) (*application, error) {
	cfg, err := config.Load()
	if err != nil {
		return nil, err
	}

	db, err := openDB(cfg.DatabaseURL)
	if err != nil {
		return nil, err
	}

	// Services
	mailer := mail.NewMailer(cfg.SMTPAddr, "noreply@studify.com")
	tokenManager := token.NewManager([]byte(cfg.JWTAccessSecret), []byte(cfg.JWTRefreshSecret), cfg.Issuer, config.AccessTokenTTL, config.RefreshTokenTTL)
	cookiesService := token.NewCookies(cfg.IsProduction(), config.AccessTokenTTL, config.RefreshTokenTTL)
	mailService := mail.NewService(db, mailer, cfg)
	emailConfirmService := emailconfirm.NewService(db, mailService)
	mfaService := mfa.NewService(db, cfg)
	resetPasswordService := resetpassword.NewService(db, mailService)
	userService := user.NewService(db, emailConfirmService)
	authService := auth.NewService(db, tokenManager, cookiesService, emailConfirmService, cfg)
	taskService := task.NewService(db)
	subjectService := subject.NewService(db)
	sharedProjectService := sharedproject.NewService(db)

	// Handlers
	h := &Handler{
		Config:       cfg,
		TokenManager: tokenManager,
		MailService:  mailService,

		Auth: &auth.Handler{
			Service: authService,
			Cookies: cookiesService,
		},

		User: &user.Handler{Service: userService},

		Mfa: &mfa.Handler{
			UserService: userService,
			Service:     mfaService,
		},
		MfaService: mfaService,

		ResetPassword: &resetpassword.Handler{
			ResetPasswordService: resetPasswordService,
		},
		ResetPasswordService: resetPasswordService,

		EmailConfirm: &emailconfirm.Handler{
			Service:     emailConfirmService,
			UserService: userService,
		},
		EmailConfirmService: emailConfirmService,

		Subject:   &subject.Handler{Service: subjectService},
		Task:      &task.Handler{Service: taskService},
		Dashboard: &dashboard.Handler{DB: db},

		SharedProjectHandler: &sharedproject.Handler{Service: sharedProjectService},
	}

	return &application{
		addr:   cfg.ServerAddr,
		db:     db,
		router: newRouter(h, cfg.CORSOrigins, reg, m),
	}, nil
}

func (a *application) close() error {
	return a.db.Close()
}

func openDB(databaseURL string) (*sql.DB, error) {
	db, err := sql.Open("pgx", databaseURL)
	if err != nil {
		return nil, err
	}

	var pingErr error
	for range 10 {
		if pingErr = db.Ping(); pingErr == nil {
			return db, nil
		}

		time.Sleep(time.Second)
	}

	db.Close()
	return nil, fmt.Errorf("connect to database: %w", pingErr)
}

func initLogger() {
	var h slog.Handler

	if os.Getenv("ENV") == "prod" {
		h = slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
			Level: slog.LevelDebug,
		})
	} else {
		h = tint.NewTextHandler(os.Stdout, &tint.Options{
			Level:      slog.LevelInfo,
			TimeFormat: time.Kitchen,
		})
	}

	slog.SetDefault(slog.New(h))
}

func initPrometheus() (*prometheus.Registry, *Metrics) {
	reg := prometheus.NewRegistry()
	reg.MustRegister(
		collectors.NewGoCollector(),
		collectors.NewProcessCollector(collectors.ProcessCollectorOpts{}),
	)

	return reg, newMetrics(reg)
}

func newMetrics(reg prometheus.Registerer) *Metrics {
	return &Metrics{
		requestsTotal: promauto.With(reg).NewCounterVec(
			prometheus.CounterOpts{
				Name: "studify_requests_total",
				Help: "Total processed requests",
			},
			[]string{"method", "route", "status"},
		),
		requestsDuration: promauto.With(reg).NewHistogramVec(
			prometheus.HistogramOpts{
				Name:    "studify_http_request_duration_seconds",
				Help:    "HTTP request latency in seconds",
				Buckets: []float64{0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5},
			},
			[]string{"method", "route"},
		),
	}
}
