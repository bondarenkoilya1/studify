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
	"studify/internal/config"
	"studify/internal/dashboard"
	"studify/internal/email"
	"studify/internal/handlers"
	"studify/internal/mail"
	"studify/internal/subject"
	"studify/internal/task"
	"studify/internal/user"
	"time"

	_ "github.com/jackc/pgx/v5/stdlib"
)

type application struct {
	addr   string
	db     *sql.DB
	router http.Handler
}

func newApplication() (*application, error) {
	cfg, err := config.Load()
	if err != nil {
		return nil, err
	}

	db, err := openDB(cfg.DatabaseURL)
	if err != nil {
		return nil, err
	}

	mailer := mail.NewMailer("mailpit:1025")

	authService := auth.NewService(
		cfg.JWTAccessSecret,
		cfg.JWTRefreshSecret,
		cfg.Issuer,
		cfg.IsProduction(),
		db,
	)

	emailService := &email.Service{
		DB:     db,
		Mailer: mailer,
		Config: cfg,
	}

	subjectHandler := &subject.Handler{DB: db}

	taskHandler := &task.Handler{DB: db}

	dashboardHandler := &dashboard.Handler{DB: db}

	mfaHandler := &mfa.Handler{
		DB:     db,
		Config: cfg,
		Auth:   authService,
	}

	userHandler := &user.Handler{
		DB:           db,
		EmailService: emailService,
	}

	resetPasswordHandler := &reset_password.Handler{
		DB:     db,
		Mailer: mailer,
		Config: cfg,
	}

	h := &handlers.Handler{
		DB:            db,
		Auth:          authService,
		Config:        cfg,
		EmailService:  emailService,
		Subject:       subjectHandler,
		Task:          taskHandler,
		Dashboard:     dashboardHandler,
		Mfa:           mfaHandler,
		User:          userHandler,
		ResetPassword: resetPasswordHandler,
	}

	return &application{
		addr:   cfg.ServerAddr,
		db:     db,
		router: newRouter(h, cfg.CORSOrigins),
	}, nil
}

func (a *application) close() error {
	return a.db.Close()
}

func run() error {
	initLogger()

	app, err := newApplication()
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

	opts := &slog.HandlerOptions{Level: slog.LevelDebug}

	if env == "prod" {
		opts.Level = slog.LevelInfo
		h = slog.NewJSONHandler(os.Stdout, opts)
	} else {
		h = slog.NewTextHandler(os.Stdout, opts)
	}

	slog.SetDefault(slog.New(h))
}
