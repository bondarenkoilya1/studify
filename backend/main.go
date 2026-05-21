package main

import (
	"log"
	"net/http"
)

func main() {
	http.HandleFunc("/subjects", SubjectsHandler)
	http.HandleFunc("/subjects/", SubjectHandler)
	log.Fatal(http.ListenAndServe(":8080", nil))
}
