package main

import (
	"log"
	"net/http"
)

func main() {
	http.HandleFunc("/subjects", SubjectsHandler)
	http.HandleFunc("/subjects/", SubjectHandler)

	http.HandleFunc("/tasks", TasksHandler)
	http.HandleFunc("/tasks/", TaskHandler)

	log.Fatal(http.ListenAndServe(":8080", nil))
}

// TODO: validate data
