package main

import (
	"log/slog"
	"os"
	"studify/internal/util"
)

func main() {
	if err := run(); err != nil {
		slog.Error("application failed",
			util.AttrError(err),
		)
		os.Exit(1)
	}
}
