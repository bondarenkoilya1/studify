package main

import (
	"database/sql"
	"net/http"
	"studify/internal/config"
	"studify/internal/database"
	"studify/internal/handlers"
	"studify/internal/mail"
	"studify/internal/utils"
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

	auth := utils.NewAuthService(cfg.JWTAccessSecret, cfg.JWTRefreshSecret, cfg.Issuer, cfg.IsProduction())
	h := &handlers.Handler{DB: db, Auth: auth}

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

	c, err := mail.ConnectSMTP("mailpit:1025")
	if err != nil {
		println(err)
	}
	defer c.Quit()

	if err := mail.SendConfirmationEmail(c, "noreply@studify.com", "gumbalt@gmail.com", "link#$"); err != nil {
		println(err)
	}

	return http.ListenAndServe(app.addr, app.router)
}
