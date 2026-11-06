package session

import (
	"testing"
)

func TestIsSameClient(t *testing.T) {
	tests := []struct {
		name     string
		session  *Session
		input    Input
		expected bool
	}{
		{
			name: "exact match",
			session: &Session{
				OS:      "macOS",
				Browser: "Chrome",
				Device:  "Computer",
				Country: "127.0.0.1",
			},
			input: Input{
				OS:      "macOS",
				Browser: "Chrome",
				Device:  "Computer",
				Country: "127.0.0.1",
			},
			expected: true,
		},
		{
			name: "different OS",
			session: &Session{
				OS:      "macOS",
				Browser: "Chrome",
				Device:  "Computer",
				Country: "127.0.0.1",
			},
			input: Input{
				OS:      "Windows",
				Browser: "Chrome",
				Device:  "Computer",
				Country: "127.0.0.1",
			},
			expected: false,
		},
		{
			name: "different browser",
			session: &Session{
				OS:      "macOS",
				Browser: "Safari",
				Device:  "Computer",
				Country: "127.0.0.1",
			},
			input: Input{
				OS:      "macOS",
				Browser: "Chrome",
				Device:  "Computer",
				Country: "127.0.0.1",
			},
			expected: false,
		},
		{
			name: "different device",
			session: &Session{
				OS:      "iOS",
				Browser: "Safari",
				Device:  "iPhone",
				Country: "127.0.0.1",
			},
			input: Input{
				OS:      "iOS",
				Browser: "Safari",
				Device:  "iPad",
				Country: "127.0.0.1",
			},
			expected: false,
		},
		{
			name: "different country",
			session: &Session{
				OS:      "macOS",
				Browser: "Chrome",
				Device:  "Computer",
				Country: "127.0.0.1",
			},
			input: Input{
				OS:      "macOS",
				Browser: "Chrome",
				Device:  "Computer",
				Country: "192.168.1.1",
			},
			expected: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			actual := isSameClient(tt.session, tt.input)
			if actual != tt.expected {
				t.Errorf("isSameClient() = %v, expected %v", actual, tt.expected)
			}
		})
	}
}
