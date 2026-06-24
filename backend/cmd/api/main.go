package main

import (
	"log"
)

func main() {
	if err := run(); err != nil {
		log.Fatal(err)
	}
}

/*
Later:
- Use JOIN methods for connecting tasks with their subjects.
- Allow to upload avatar for the lecturer.
- Allow to set the file with the task.
- Add calendar where you can click on a date and assign a task.
- Convert all avatars to WebP.
*/
