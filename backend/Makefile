APP_NAME ?= studify
MAIN ?= ./cmd/api

ifneq (,$(wildcard .publicEnv))
include .publicEnv
export
endif

.PHONY: run build test fmt fmt-check vet lint check clean deps

run:
	go run $(MAIN)

build:
	mkdir -p bin
	go build -o bin/$(APP_NAME) $(MAIN)

test:
	go test ./...

fmt:
	gofmt -w .

fmt-check:
	test -z "$$(gofmt -l .)"

vet:
	go vet ./...

lint:
	golangci-lint run

check: fmt-check vet lint test

clean:
	rm -rf bin

deps:
	go mod tidy
