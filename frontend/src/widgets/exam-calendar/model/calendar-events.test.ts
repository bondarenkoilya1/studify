import { describe, expect, it } from "vitest";
import type { Task } from "@/shared/api";
import { taskToCalendarEvents } from "./calendar-events";

const fixture = {
  id: 1,
  subject_id: 2,
  name: "Подготовить отчёт",
  estimated_time: 45,
  status: "not_completed",
} as Task;

describe("taskToCalendarEvents", () => {
  it("puts the planned work and deadline on separate calendar days", () => {
    const events = taskToCalendarEvents(
      [
        {
          ...fixture,
          scheduled_date: "2026-12-05",
          deadline_date: "2026-12-08",
          deadline: "2026-12-07T21:00:00Z",
        },
      ],
      [],
      new Date(2026, 11, 8, 23, 59),
    );

    expect(events).toMatchObject([
      {
        id: "task-1-plan",
        start: "2026-12-05",
        allDay: true,
        extendedProps: { kind: "plan", taskId: 1 },
      },
      {
        id: "task-1-deadline",
        start: "2026-12-08",
        allDay: true,
        extendedProps: { kind: "deadline", taskId: 1, overdue: false },
      },
    ]);
  });

  it("shows one combined event when both all-day dates coincide", () => {
    const events = taskToCalendarEvents(
      [
        {
          ...fixture,
          scheduled_date: "2026-12-05",
          deadline_date: "2026-12-05",
        },
      ],
      [],
      new Date(2026, 11, 6),
    );

    expect(events).toMatchObject([
      {
        start: "2026-12-05",
        extendedProps: { kind: "plan-and-deadline", overdue: true },
      },
    ]);
  });

  it("preserves the time of legacy plans and deadlines on the same day", () => {
    const events = taskToCalendarEvents(
      [
        {
          ...fixture,
          scheduled_at: "2026-12-05T12:00:00Z",
          deadline: "2026-12-05T16:00:00Z",
        },
      ],
      [],
      new Date("2026-12-05T17:00:00Z"),
    );

    expect(events).toMatchObject([
      {
        start: "2026-12-05T12:00:00Z",
        end: "2026-12-05T12:45:00.000Z",
        allDay: false,
      },
      {
        start: "2026-12-05T16:00:00Z",
        allDay: false,
        extendedProps: { overdue: true },
      },
    ]);
  });

  it("omits completed tasks and tasks with no dates", () => {
    expect(
      taskToCalendarEvents(
        [
          fixture,
          { ...fixture, status: "completed", deadline_date: "2026-12-08" },
        ],
        [],
      ),
    ).toEqual([]);
  });
});
