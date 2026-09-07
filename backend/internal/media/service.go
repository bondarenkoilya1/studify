package media

import (
	"fmt"
	"image"
	"io"
	"os"
	"path/filepath"

	"github.com/chai2010/webp"
	"github.com/google/uuid"
)

func SaveImageAsWebp(r io.Reader, c ImageConstraints, dir string) (string, error) {
	img, format, err := image.Decode(r)
	if err != nil {
		return "", fmt.Errorf("%w: %v", ErrDecodeFailed, err)
	}

	switch format {
	case "png", "jpeg", "webp":
	default:
		return "", ErrInvalidFormat
	}

	bounds := img.Bounds()
	if (c.MaxWidth > 0 && bounds.Dx() > c.MaxWidth) || (c.MaxHeight > 0 && bounds.Dy() > c.MaxHeight) {
		return "", ErrDimensionsExceed
	}

	if err := os.MkdirAll(dir, 0o755); err != nil {
		return "", fmt.Errorf("mkdir: %w", err)
	}

	filename := uuid.New().String() + ".webp"
	fullPath := filepath.Join(dir, filename)

	dst, err := os.Create(fullPath)
	if err != nil {
		return "", fmt.Errorf("create file: %w", err)
	}
	defer dst.Close()

	quality := c.Quality
	if quality <= 0 {
		quality = 85
	}
	if quality >= 101 {
		quality = 100
	}

	if err = webp.Encode(dst, img, &webp.Options{Quality: float32(quality)}); err != nil {
		_ = os.Remove(fullPath)
		return "", fmt.Errorf("encode webp: %w", err)
	}

	return filename, nil
}
