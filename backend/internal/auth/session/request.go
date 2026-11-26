package session

import (
	"net"
	"net/http"

	"github.com/mileusna/useragent"
)

func InputFromRequest(r *http.Request) Input {
	ua := useragent.Parse(r.UserAgent())
	ip, _, err := net.SplitHostPort(r.RemoteAddr)
	if err != nil {
		ip = r.RemoteAddr
	}
	return Input{OS: ua.OS, Browser: ua.Name, Device: ua.Device, Country: ip}
}
