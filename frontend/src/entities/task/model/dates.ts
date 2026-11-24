import { differenceInCalendarDays, parseISO } from "date-fns";
import type { Task } from "@/shared/api";

export function formatTaskDeadline(
  task: Pick<Task, "deadline" | "deadline_date">,
  now = new Date(),
) {
  const value = task.deadline_date ?? task.deadline;
  if (!value) return null;

  const date = parseISO(value);
  const daysUntilDue = differenceInCalendarDays(date, now);
  const formatted = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  if (daysUntilDue < 0 || (!task.deadline_date && date < now)) {
    return { text: `${formatted} · overdue`, urgent: true };
  }

  if (daysUntilDue === 0) {
    return { text: "Due today", urgent: true };
  }

  if (daysUntilDue === 1) {
    return { text: "Due tomorrow", urgent: true };
  }

  return { text: `Due ${formatted}`, urgent: false };
}
