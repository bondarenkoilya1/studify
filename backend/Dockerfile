FROM golang:1.26.11-alpine3.24@sha256:ecb67f987aa1a57794c91d19ade7ae0209f2f0f5496aaef9e6ae85ddf92d02ab AS build

RUN apk add --no-cache build-base=0.5-r4
WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download
COPY cmd ./cmd
COPY internal ./internal
RUN CGO_ENABLED=1 go build -mod=readonly -trimpath -buildvcs=false \
    -ldflags '-s -w -linkmode external -extldflags "-static"' \
    -o /out/studify-api ./cmd/api

FROM alpine:3.24.4@sha256:f59abe656b692d901e184be3445e084786602108599d2a51d229c0f5a48c71bf

RUN addgroup -S -g 10001 studify \
    && adduser -S -D -H -u 10001 -G studify studify \
    && mkdir -p /app/data \
    && chown 10001:10001 /app/data
COPY --from=build /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/ca-certificates.crt
COPY --from=build /out/studify-api /usr/local/bin/studify-api

WORKDIR /app
USER 10001:10001
ENV ENV=production SERVER_ADDR=:8080
EXPOSE 8080
ENTRYPOINT ["/usr/local/bin/studify-api"]
