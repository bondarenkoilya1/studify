package media

import (
	"bytes"
	"fmt"
	"image"
	"image/color"
	"image/draw"
	"image/jpeg"
	"image/png"
	"os"
	"path/filepath"
	"testing"

	"github.com/chai2010/webp"
	"github.com/go-pdf/fpdf"
)

var ic = ImageConstraints{
	MaxWidth:  2560,
	MaxHeight: 2560,
	Quality:   85,
}

func makePDF(t *testing.T, pages int) []byte {
	t.Helper()

	pdf := fpdf.New("P", "mm", "A4", "")
	pdf.SetFont("Arial", "", 14)

	for i := 1; i <= pages; i++ {
		pdf.AddPage()
		pdf.Cell(40, 10, fmt.Sprintf("Test page %d", i))
	}

	var buf bytes.Buffer
	if err := pdf.Output(&buf); err != nil {
		t.Fatalf("generate pdf: %v", err)
	}
	return buf.Bytes()
}

func makePNG(t *testing.T, w, h int) []byte {
	t.Helper()

	img := image.NewRGBA(image.Rect(0, 0, w, h))
	blue := &image.Uniform{C: color.RGBA{R: 30, G: 100, B: 220, A: 255}}
	draw.Draw(img, img.Bounds(), blue, image.Point{}, draw.Src)

	var buf bytes.Buffer
	if err := png.Encode(&buf, img); err != nil {
		t.Fatalf("encode png: %v", err)
	}
	return buf.Bytes()
}

func makeJPEG(t *testing.T, w, h int) []byte {
	t.Helper()

	img := image.NewRGBA(image.Rect(0, 0, w, h))
	blue := &image.Uniform{C: color.RGBA{R: 30, G: 100, B: 220, A: 255}}
	draw.Draw(img, img.Bounds(), blue, image.Point{}, draw.Src)

	var buf bytes.Buffer
	if err := jpeg.Encode(&buf, img, &jpeg.Options{Quality: 85}); err != nil {
		t.Fatalf("encode jpeg: %v", err)
	}
	return buf.Bytes()
}

func makeWEBP(t *testing.T, w, h int) []byte {
	t.Helper()

	img := image.NewRGBA(image.Rect(0, 0, w, h))
	blue := &image.Uniform{C: color.RGBA{R: 30, G: 100, B: 220, A: 255}}
	draw.Draw(img, img.Bounds(), blue, image.Point{}, draw.Src)

	var buf bytes.Buffer
	if err := webp.Encode(&buf, img, &webp.Options{Quality: 85}); err != nil {
		t.Fatalf("encode jpeg: %v", err)
	}
	return buf.Bytes()
}

func TestSaveImageAsWebp(t *testing.T) {
	/*
		1. png too large
		2. png big bounds
	*/

	tests := []struct {
		name    string
		file    []byte
		wantErr bool
		wantW   int
		wantH   int
	}{
		{"PDF", makePDF(t, 10), true, 0, 0},
		{"PNG 300x400", makePNG(t, 300, 400), false, 300, 400},
		{"JPEG 100x100", makeJPEG(t, 100, 100), false, 100, 100},
		{"WEBP 200x150", makeWEBP(t, 200, 150), false, 200, 150},
		{"TXT", []byte("hello, this is a plain text file"), true, 0, 0},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			r := bytes.NewReader(tt.file)
			dir := t.TempDir()

			name, err := SaveImageAsWebp(r, ic, dir)

			if tt.wantErr {
				if err == nil {
					t.Fatalf("expected error, got nil (name=%q)", name)
				}
				entries, readErr := os.ReadDir(dir)
				if readErr != nil {
					t.Fatalf("read dir: %v", readErr)
				}
				if len(entries) != 0 {
					t.Errorf("dir not empty after error: %d files", len(entries))
				}
				return
			}

			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}

			if ext := filepath.Ext(name); ext != ".webp" {
				t.Errorf("ext = %q, want .webp", ext)
			}

			full := filepath.Join(dir, name)
			got, err := os.ReadFile(full)
			if err != nil {
				t.Fatalf("read saved file: %v", err)
			}

			if len(got) < 12 {
				t.Fatalf("file too short: %d bytes", len(got))
			}

			if string(got[0:4]) != "RIFF" || string(got[8:12]) != "WEBP" {
				t.Fatalf("not a webp signature: %q ... %q", got[0:4], got[8:12])
			}

			img, err := webp.Decode(bytes.NewReader(got))
			if err != nil {
				t.Fatalf("decode webp: %v", err)
			}
			b := img.Bounds()
			if b.Dx() != tt.wantW || b.Dy() != tt.wantH {
				t.Errorf("size = %dx%d, want %dx%d", b.Dx(), b.Dy(), tt.wantW, tt.wantH)
			}
		})
	}

}
