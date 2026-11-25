package rc

import "testing"

func TestNormalize(t *testing.T) {
	tests := []struct {
		name string
		code string
		want string
	}{
		{name: "as issued", code: "ABCD-EFGH-JK23", want: "ABCD-EFGH-JK23"},
		{name: "copied in lowercase", code: " abcd-efgh-jk23\n", want: "ABCD-EFGH-JK23"},
		{name: "without separators", code: "ABCDEFGHJK23", want: "ABCD-EFGH-JK23"},
		{name: "authenticator code", code: "123456"},
		{name: "misplaced separators", code: "ABC-DEFGH-JK23"},
		{name: "invalid alphabet", code: "ABCD-EFOH-JK23"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, ok := Normalize(tt.code)
			if got != tt.want || ok != (tt.want != "") {
				t.Errorf("Normalize(%q) = (%q, %t), want (%q, %t)", tt.code, got, ok, tt.want, tt.want != "")
			}
		})
	}
}
