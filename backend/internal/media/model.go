package media

import "errors"

var (
	ErrInvalidFormat    = errors.New("unsupported image format (use PNG, JPEG, WEBP)")
	ErrDimensionsExceed = errors.New("image dimensions exceed allowed limits")
	ErrDecodeFailed     = errors.New("failed to decode image")
)

type ImageConstraints struct {
	MaxWidth  int
	MaxHeight int
	Quality   int
}
