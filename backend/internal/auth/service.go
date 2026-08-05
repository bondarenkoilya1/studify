package auth

type Service struct {
	accessSecret  string
	refreshSecret string
	issuer        string
	secureCookies bool
}

func NewService(accessSecret, refreshSecret, issuer string, secureCookies bool) *Service {
	return &Service{
		accessSecret:  accessSecret,
		refreshSecret: refreshSecret,
		issuer:        issuer,
		secureCookies: secureCookies,
	}
}
