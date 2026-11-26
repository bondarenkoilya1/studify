package main

import (
	"context"
	"database/sql"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"studify/internal/auth/emailconfirm"
	"studify/internal/auth/session"
	"studify/internal/sharedproject"
	"syscall"
	"time"

	_ "github.com/jackc/pgx/v5/stdlib"
	"github.com/lmittmann/tint"
	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/collectors"
	"github.com/prometheus/client_golang/prometheus/promauto"
	"github.com/prometheus/client_golang/prometheus/promhttp"

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
	Session              *session.Handler
}

type Metrics struct {
	requestsTotal    *prometheus.CounterVec
	requestsDuration *prometheus.HistogramVec
}

func run() error {
	cfg, err := config.Load()
	if err != nil {
		return err
	}
	initLogger(cfg.IsProduction())
	reg, m := initPrometheus()

	app, err := newApplication(cfg, reg, m)
	if err != nil {
		return err
	}
	defer app.close()

	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	servers := []*http.Server{newHTTPServer(app.addr, app.router)}
	if cfg.MetricsAddr != "" {
		metrics := http.NewServeMux()
		metrics.Handle("GET /metrics", promhttp.HandlerFor(reg, promhttp.HandlerOpts{}))
		servers = append(servers, newHTTPServer(cfg.MetricsAddr, metrics))
	}
	return serveHTTP(ctx, servers...)
}

func newApplication(cfg *config.Config, reg *prometheus.Registry, m *Metrics) (*application, error) {
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
	sessionService := session.NewService(db)
	authService := auth.NewService(db, tokenManager, cookiesService, emailConfirmService, sessionService, cfg)
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

		User: &user.Handler{Service: userService, Cookies: cookiesService},

		Mfa:        &mfa.Handler{Service: mfaService},
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

		Session: &session.Handler{
			Service: sessionService,
		},
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

func initLogger(production bool) {
	var h slog.Handler

	if production {
		h = slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
			Level: slog.LevelInfo,
		})
	} else {
		h = tint.NewTextHandler(os.Stdout, &tint.Options{
			Level:      slog.LevelDebug,
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
