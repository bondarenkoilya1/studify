package main

import (
	"database/sql"
	"net/http"
	"studify/internal/auth"
	"studify/internal/config"
	"studify/internal/database"
	"studify/internal/handlers"
	"studify/internal/mail"
	"studify/internal/services"
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

	db, err := database.OpenDB(cfg.DatabaseURL)
	if err != nil {
		return nil, err
	}

	mailer := mail.NewMailer("mailpit:1025")

	authService := auth.NewService(cfg.JWTAccessSecret, cfg.JWTRefreshSecret, cfg.Issuer, cfg.IsProduction())

	emailService := &services.EmailService{
		DB:     db,
		Mailer: mailer,
		Config: cfg,
	}

	h := &handlers.Handler{DB: db, Auth: authService, Config: cfg, EmailService: emailService}

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
	app, err := newApplication()
	if err != nil {
		return err
	}
	defer app.close()

	return http.ListenAndServe(app.addr, app.router)
}

// TODO: maybe I should make a single table "tokens" where I would differ theme by "type" column
