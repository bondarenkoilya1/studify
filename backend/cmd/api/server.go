package main

import (
	"context"
	"errors"
	"fmt"
	"net/http"
	"time"
)

const shutdownTimeout = 30 * time.Second

func newHTTPServer(addr string, handler http.Handler) *http.Server {
	return &http.Server{
		Addr:              addr,
		Handler:           handler,
		ReadHeaderTimeout: 5 * time.Second,
		ReadTimeout:       2 * time.Minute,
		WriteTimeout:      3 * time.Minute,
		IdleTimeout:       time.Minute,
	}
}

func serveHTTP(ctx context.Context, servers ...*http.Server) error {
	serveErrors := make(chan error, len(servers))
	for _, server := range servers {
		go func() {
			err := server.ListenAndServe()
			if errors.Is(err, http.ErrServerClosed) {
				err = nil
			}
			if err != nil {
				err = fmt.Errorf("listen on %s: %w", server.Addr, err)
			}
			serveErrors <- err
		}()
	}

	var result error
	select {
	case <-ctx.Done():
	case result = <-serveErrors:
	}

	shutdownCtx, cancel := context.WithTimeout(context.Background(), shutdownTimeout)
	defer cancel()
	shutdownErrors := make(chan error, len(servers))
	for _, server := range servers {
		go func() {
			err := server.Shutdown(shutdownCtx)
			if err != nil {
				err = errors.Join(err, server.Close())
				err = fmt.Errorf("shut down %s: %w", server.Addr, err)
			}
			shutdownErrors <- err
		}()
	}
	for range servers {
		result = errors.Join(result, <-shutdownErrors)
	}
	return result
}
