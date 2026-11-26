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
    ).toEqual({ text: "Дедлайн сегодня", urgent: true });
  });

  it("marks an elapsed deadline on the same day as overdue", () => {
    expect(
      formatTaskDeadline(
        { deadline_date: null, deadline: "2026-11-26T10:00:00" },
        now,
      ),
    ).toEqual({ text: "26 ноября · просрочено", urgent: true });
  });

  it("labels tomorrow from a date-only deadline", () => {
    expect(
      formatTaskDeadline({ deadline_date: "2026-11-27", deadline: null }, now),
    ).toEqual({ text: "Дедлайн завтра", urgent: true });
  });

  it("ignores invalid dates", () => {
    expect(
      formatTaskDeadline({ deadline_date: "invalid", deadline: null }, now),
    ).toBeNull();
  });
});
