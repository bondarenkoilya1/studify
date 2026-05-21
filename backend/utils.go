package main

import (
	"fmt"
	"strconv"
	"strings"
)

func GetID(path, prefix string) (int, error) {
	idStr := strings.TrimPrefix(path, prefix)
	if idStr == "" {
		return 0, fmt.Errorf("missing ID")
	}

	id, err := strconv.Atoi(idStr)
	if err != nil {
		return 0, fmt.Errorf("ID must be an integer")
	}

	return id, nil
}
