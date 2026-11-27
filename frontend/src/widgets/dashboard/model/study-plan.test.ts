import { describe, expect, it } from "vitest";
import type { Task } from "@/shared/api";
import { getStudyPlan } from "./study-plan";

const now = new Date(2026, 11, 2, 13);
const task = (id: number, fields: Partial<Task> = {}): Task =>
  ({
    id,
    subject_id: 1,
    name: `Задача ${id}`,
    status: "not_completed",
    scheduled_date: null,
    scheduled_at: null,
    deadline_date: null,
    deadline: null,
    ...fields,
  }) as Task;

describe("getStudyPlan", () => {
  it("shows a task once, prioritizing overdue and today's commitments", () => {
    const overdue = task(1, {
      deadline_date: "2026-12-01",
      scheduled_date: "2026-12-02",
    });
    const today = task(2, {
      scheduled_date: "2026-12-02",
      deadline_date: "2026-12-04",
      status: "ongoing",
    });
    const week = task(3, {
      scheduled_date: "2026-11-30",
      deadline_date: "2026-12-06",
    });
    const nextWeek = task(4, { deadline_date: "2026-12-07" });
    const noDate = task(5);
    const completed = task(6, {
      status: "completed",
      deadline_date: "2026-12-01",
    });
    const plan = getStudyPlan(
      [noDate, today, completed, week, overdue, nextWeek],
      now,
    );

    expect(plan.overdue).toEqual([overdue]);
    expect(plan.today).toEqual([today]);
    expect(plan.week).toEqual([week]);
    expect(plan.later).toEqual([nextWeek, noDate]);
    expect(plan.completed).toBe(1);
    expect(plan.ongoing).toBe(1);
    expect(plan.weekStart).toEqual(new Date(2026, 10, 30));
  });

  it("sorts by the next date and respects legacy times and date-only deadlines", () => {
    const before = task(1, { deadline: "2026-12-02T12:00:00" });
    const laterToday = task(2, { scheduled_at: "2026-12-02T14:00:00" });
    const allDay = task(3, {
      deadline_date: "2026-12-02",
      deadline: "2026-12-02T10:00:00",
    });
    const plan = getStudyPlan([laterToday, before, allDay], now);

    expect(plan.overdue).toEqual([before]);
    expect(plan.today).toEqual([allDay, laterToday]);
  });
});
