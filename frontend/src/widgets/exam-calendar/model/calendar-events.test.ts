import { describe, expect, it } from "vitest";
import type { Subject, Task } from "@/shared/api";
import {
  getInitialCalendarMonth,
  subjectToCalendarEvents,
  taskToCalendarEvents,
} from "./calendar-events";

describe("getInitialCalendarMonth", () => {
  it("opens the earliest month across exams and visible tasks", () => {
    const subjects = [
      { id: 1, exam_date: "2027-02-13", scope: "science" } as Subject,
    ];
    const tasks = [
      { id: 1, subject_id: 1, scheduled_date: "2026-12-01" },
      {
        id: 2,
        subject_id: 1,
        scheduled_date: "2026-04-20",
        status: "completed",
      },
      { id: 3, subject_id: 1 },
    ] as Task[];

    const events = [
      ...subjectToCalendarEvents(subjects),
      ...taskToCalendarEvents(tasks, subjects),
    ];

    expect(getInitialCalendarMonth(events)).toEqual(new Date(2026, 11, 1));
  });

  it("can open an exam-only month before the current month", () => {
    expect(getInitialCalendarMonth([{ start: "2025-05-17" }])).toEqual(
      new Date(2025, 4, 1),
    );
  });

  it("lets the calendar use the current month when there are no valid events", () => {
    expect(getInitialCalendarMonth([])).toBeUndefined();
    expect(getInitialCalendarMonth([{ start: "invalid" }])).toBeUndefined();
  });
});
