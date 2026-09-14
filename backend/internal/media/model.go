package media

import (
	"errors"
	"fmt"
)

var (
	ErrInvalidFormat    = errors.New("unsupported image format (use PNG, JPEG, WEBP)")
	ErrDimensionsExceed = errors.New("image dimensions exceed allowed limits")
	ErrDecodeFailed     = errors.New("failed to decode image")
	ErrFileTooLarge     = fmt.Errorf("file exceeds maximum allowed size")
	ErrInvalidPDFFormat = errors.New("invalid file format: not a valid PDF")
	ErrPDFTooLarge      = errors.New("pdf exceeds maximum allowed size")
)

type ImageConstraints struct {
	MaxWidth  int
	MaxHeight int
	Quality   int
}

var pdfMagicHeader = []byte("%PDF-")
