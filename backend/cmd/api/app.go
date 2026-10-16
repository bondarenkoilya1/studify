package main

import (
	"database/sql"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"studify/internal/auth"
	"studify/internal/auth/mfa"
	"studify/internal/auth/reset_password"
	"studify/internal/auth/token"
	"studify/internal/config"
	"studify/internal/dashboard"
	"studify/internal/mail"
	"studify/internal/subject"
	"studify/internal/task"
	"studify/internal/user"
	"time"

	_ "github.com/jackc/pgx/v5/stdlib"
	"github.com/lmittmann/tint"
	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/collectors"
	"github.com/prometheus/client_golang/prometheus/promauto"
)

type application struct {
	addr   string
	db     *sql.DB
	router http.Handler
}

type Handler struct {
	Token                *token.Service // todo: rename to service
	Config               *config.Config
	MailService          *mail.Service
	Auth                 *auth.Handler
	AuthService          *auth.Service
	Subject              *subject.Handler
	Task                 *task.Handler
	Dashboard            *dashboard.Handler
	Mfa                  *mfa.Handler
	MfaService           *mfa.Service
	User                 *user.Handler
	UserService          *user.Service
	ResetPassword        *reset_password.Handler
	ResetPasswordService *reset_password.Service
}

type Metrics struct {
	requestsTotal    *prometheus.CounterVec
	requestsDuration *prometheus.HistogramVec
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

func newApplication(reg *prometheus.Registry, m *Metrics) (*application, error) {
	cfg, err := config.Load()
	if err != nil {
		return nil, err
	}

	db, err := openDB(cfg.DatabaseURL)
	if err != nil {
		return nil, err
	}

	mailer := mail.NewMailer(cfg.SMTPAddr, "noreply@studify.com")

	tokenService := token.NewService(
		cfg.JWTAccessSecret,
		cfg.JWTRefreshSecret,
		cfg.Issuer,
		cfg.IsProduction(),
		db,
	)
	mailService := mail.NewService(db, mailer, cfg)
	authService := auth.NewService(db)
	userService := user.NewService(db, mailService)
	mfaService := mfa.NewService(db)
	resetPasswordService := reset_password.NewService(db, mailService)

	authHandler := &auth.Handler{
		DB:          db,
		Token:       tokenService,
		Config:      cfg,
		MailService: mailService,
		AuthService: authService,
		UserService: userService,
	}

	subjectHandler := &subject.Handler{DB: db}

	taskHandler := &task.Handler{DB: db}

	dashboardHandler := &dashboard.Handler{DB: db}

	mfaHandler := &mfa.Handler{
		DB:          db,
		Config:      cfg,
		Token:       tokenService,
		UserService: userService,
		MfaService:  mfaService,
	}

	userHandler := &user.Handler{
		DB:          db,
		MailService: mailService,
		UserService: userService,
	}

	resetPasswordHandler := &reset_password.Handler{
		DB:                   db,
		ResetPasswordService: resetPasswordService,
	}

	h := &Handler{
		Token:                tokenService,
		Config:               cfg,
		MailService:          mailService,
		Auth:                 authHandler,
		AuthService:          authService,
		Subject:              subjectHandler,
		Task:                 taskHandler,
		Dashboard:            dashboardHandler,
		Mfa:                  mfaHandler,
		MfaService:           mfaService,
		User:                 userHandler,
		ResetPassword:        resetPasswordHandler,
		ResetPasswordService: resetPasswordService,
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
	env := os.Getenv("ENV")

	if env == "prod" {
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
	m := newMetrics(reg)

	return reg, m
}
