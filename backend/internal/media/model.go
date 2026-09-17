package media

import (
	"errors"
)

var (
	ErrInvalidFormat     = errors.New("unsupported image format (use PNG, JPEG, WEBP)")
	ErrDimensionsExceed  = errors.New("image dimensions exceed allowed limits")
	ErrDecodeFailed      = errors.New("failed to decode image")
	ErrInvalidFileFormat = errors.New("invalid file format: not a valid PDF/TXT")
	ErrFileTooLarge      = errors.New("file exceeds maximum allowed size")
	ErrFileEmpty         = errors.New("file is empty")
)

type ImageConstraints struct {
	MaxWidth  int
	MaxHeight int
	Quality   int
}
