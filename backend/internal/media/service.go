package media

import (
	"bytes"
	"errors"
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

func SavePDF(r io.Reader, sizeLimit int64, dir string) (string, error) {
	reader := r
	if sizeLimit > 0 {
		reader = io.LimitReader(r, sizeLimit+1)
	}

	header := make([]byte, 512)
	n, err := io.ReadFull(reader, header)
	if err != nil && !errors.Is(err, io.ErrUnexpectedEOF) && !errors.Is(err, io.EOF) {
		return "", fmt.Errorf("read header: %w", err)
	}

	if n < len(pdfMagicHeader) || !bytes.HasPrefix(header[:n], pdfMagicHeader) {
		return "", ErrInvalidPDFFormat
	}

	if err := os.MkdirAll(dir, 0o755); err != nil {
		return "", fmt.Errorf("mkdir: %w", err)
	}

	filename := uuid.New().String() + ".pdf"
	fullPath := filepath.Join(dir, filename)

	dst, err := os.Create(fullPath)
	if err != nil {
		return "", fmt.Errorf("create file: %w", err)
	}
	defer dst.Close()

	if _, err := dst.Write(header[:n]); err != nil {
		_ = os.Remove(fullPath)
		return "", fmt.Errorf("write header: %w", err)
	}

	written, err := io.Copy(dst, reader)
	if err != nil {
		_ = os.Remove(fullPath)
		return "", fmt.Errorf("copy stream: %w", err)
	}

	totalSize := int64(n) + written
	if sizeLimit > 0 && totalSize > sizeLimit {
		_ = os.Remove(fullPath)
		return "", ErrPDFTooLarge
	}

	return filename, nil
}
