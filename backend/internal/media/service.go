package media

import (
	"bytes"
	"errors"
	"fmt"
	"image"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"

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

func SaveFile(r io.Reader, sizeLimit int64, dir string) (filename string, sizeBytes int64, contentType string, err error) {
	reader := r
	if sizeLimit > 0 {
		reader = io.LimitReader(r, sizeLimit+1)
	}

	header := make([]byte, 512)
	n, err := io.ReadFull(reader, header)
	if err != nil && !errors.Is(err, io.ErrUnexpectedEOF) && !errors.Is(err, io.EOF) {
		return "", 0, "", fmt.Errorf("read header: %w", err)
	}

	if n == 0 {
		return "", 0, "", ErrFileEmpty
	}

	actualBytes := header[:n]
	contentType = http.DetectContentType(actualBytes)
	var extension string

	if bytes.HasPrefix(actualBytes, []byte("%PDF-")) {
		extension = ".pdf"
		contentType = "application/pdf" // sometimes rewrites application/octet-stream
	} else if strings.HasPrefix(contentType, "text/plain") {
		extension = ".txt"
	} else {
		return "", 0, "", ErrInvalidFileFormat
	}

	if err = os.MkdirAll(dir, 0o755); err != nil {
		return "", 0, "", fmt.Errorf("mkdir: %w", err)
	}

	filename = uuid.New().String() + extension
	fullPath := filepath.Join(dir, filename)

	dst, err := os.Create(fullPath)
	if err != nil {
		return "", 0, "", fmt.Errorf("create file: %w", err)
	}
	defer dst.Close()

	if _, err = dst.Write(actualBytes); err != nil {
		_ = os.Remove(fullPath)
		return "", 0, "", fmt.Errorf("write header: %w", err)
	}

	written, err := io.Copy(dst, reader)
	if err != nil {
		_ = os.Remove(fullPath)
		return "", 0, "", fmt.Errorf("copy stream: %w", err)
	}

	totalSize := int64(n) + written
	if sizeLimit > 0 && totalSize > sizeLimit {
		_ = os.Remove(fullPath)
		return "", 0, "", ErrFileTooLarge
	}

	return filename, totalSize, contentType, nil
}
