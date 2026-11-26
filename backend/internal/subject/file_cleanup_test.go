package subject

import (
	"path/filepath"
	"testing"
)

func TestCleanupAssetPath(t *testing.T) {
	const id = "3ef23fae-32f0-4f21-aae3-f3c697df8ad0"
	cases := []struct {
		url         string
		path        string
		isThumbnail bool
	}{
		{filesPublicDir + id + ".pdf", filepath.Join(filesDir, id+".pdf"), false},
		{filesPublicDir + id + ".txt", filepath.Join(filesDir, id+".txt"), false},
		{thumbnailsPublicDir + id + ".webp", filepath.Join(thumbnailsDir, id+".webp"), true},
		{thumbnailsPublicDir + id + ".txt", "", false},
		{filesPublicDir + "../" + id + ".pdf", "", false},
		{thumbnailsPublicDir + "other.webp", "", false},
		{"https://example.com/image.webp", "", false},
	}
	for _, tc := range cases {
		path, isThumbnail := cleanupAssetPath(tc.url)
		if path != tc.path || isThumbnail != tc.isThumbnail {
			t.Errorf("cleanupAssetPath(%q) = (%q, %t), want (%q, %t)", tc.url, path, isThumbnail, tc.path, tc.isThumbnail)
		}
	}
}
