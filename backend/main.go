package main

import (
	"fmt"
	"log"
	"net/http"
	"time"
)

type subject struct {
	lecturer string
	examDate time.Time
}

var subjects []subject

func main() {
	subjects = append(subjects, subject{lecturer: "Ivan Ivanovich", examDate: time.Date(2026, time.June, 5, 12, 0, 0, 0, time.Local)})
	subjects = append(subjects, subject{lecturer: "Ivan Ivanovich", examDate: time.Date(2026, time.June, 5, 12, 0, 0, 0, time.Local)})
	subjects = append(subjects, subject{lecturer: "Ivan Ivanovich", examDate: time.Date(2026, time.June, 5, 12, 0, 0, 0, time.Local)})
	subjects = append(subjects, subject{lecturer: "Ivan Ivanovich", examDate: time.Date(2026, time.June, 5, 12, 0, 0, 0, time.Local)})

	http.HandleFunc("/subjects", getSubjects)

	log.Fatal(http.ListenAndServe(":8080", nil))

}

func getSubjects(w http.ResponseWriter, r *http.Request) {
	for _, subj := range subjects {
		_, err := fmt.Fprintf(w, "Lecturer: %s will take the exam at %s\n", subj.lecturer, subj.examDate)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
	}
}

func formatDate() {}
