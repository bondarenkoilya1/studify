package util

import (
	"fmt"
	"os"
)

func EnsureDir(path string) error {
	if err := os.MkdirAll(path, 0o755); err != nil {
		return fmt.Errorf("prepare storage directory %q: %w", path, err)
	}

	file, err := os.CreateTemp(path, ".check-*")
	if err != nil {
		return fmt.Errorf("storage directory %q is not writable: %w", path, err)
	}

	name := file.Name()

	if err := file.Close(); err != nil {
		return fmt.Errorf("close check file %q: %w", name, err)
	}

	if err := os.Remove(name); err != nil {
		return fmt.Errorf("remove check file %q: %w", name, err)
	}

	return nil
}
