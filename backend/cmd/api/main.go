package main

import (
	"log"
)

func main() {
	if err := run(); err != nil {
		log.Fatal(err)
	}
}

/* Later:
- NOW: handle refresh tokens
- Use JOIN methods for connecting tasks with their subjects
- Allow to upload avatar for the lecturer
- Allow to set description for the task
- Allow to set the file with the task
- Add calendar where you ca click on date an assign task

- Convert all avatars to WebP
*/
