import { describe, expect, it } from "vitest";
import { formatTaskDeadline } from "./dates";

describe("formatTaskDeadline", () => {
  const now = new Date(2026, 10, 26, 12);

  it("keeps a date-only deadline due for the entire local day", () => {
    expect(
      formatTaskDeadline(
        { deadline_date: "2026-11-26", deadline: "2026-11-26T00:00:00Z" },
        now,
      ),
    ).toEqual({ text: "Сдать сегодня", overdue: false, urgent: true });
  });

  it("marks an elapsed deadline on the same day as overdue", () => {
    expect(
      formatTaskDeadline(
        { deadline_date: null, deadline: "2026-11-26T10:00:00" },
        now,
      ),
    ).toEqual({
      text: "26 ноября, 10:00 · просрочено",
      overdue: true,
      urgent: true,
    });
  });

  it("labels tomorrow from a date-only deadline", () => {
    expect(
      formatTaskDeadline({ deadline_date: "2026-11-27", deadline: null }, now),
    ).toEqual({ text: "Сдать завтра", overdue: false, urgent: true });
  });

  it("only marks an all-day deadline overdue at the next local midnight", () => {
    const task = {
      deadline_date: "2026-11-26",
      deadline: "2026-11-26T00:00:00Z",
    };
    expect(
      formatTaskDeadline(task, new Date(2026, 10, 26, 23, 59))?.overdue,
    ).toBe(false);
    expect(
      formatTaskDeadline(task, new Date(2026, 10, 27, 0, 0))?.overdue,
    ).toBe(true);
    expect(
      formatTaskDeadline(
        { ...task, status: "completed" },
        new Date(2026, 10, 27),
      )?.overdue,
    ).toBe(false);
  });

  it("ignores invalid dates", () => {
    expect(
      formatTaskDeadline({ deadline_date: "invalid", deadline: null }, now),
    ).toBeNull();
  });
});
