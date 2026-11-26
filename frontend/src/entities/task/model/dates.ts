import { differenceInCalendarDays, isValid, parseISO } from "date-fns";
import type { Task } from "@/shared/api";
import { formatStudyDate } from "@/shared/lib/study-date";

export function formatTaskDeadline(
  task: Pick<Task, "deadline" | "deadline_date">,
  now = new Date(),
) {
  const value = task.deadline_date ?? task.deadline;
  if (!value) return null;

  const date = parseISO(value);
  if (!isValid(date)) return null;
  const daysUntilDue = differenceInCalendarDays(date, now);

  if (daysUntilDue < 0 || (!task.deadline_date && date < now)) {
    return { text: `${formatStudyDate(date)} · просрочено`, urgent: true };
  }

  if (daysUntilDue === 0) {
    return { text: "Дедлайн сегодня", urgent: true };
  }

  if (daysUntilDue === 1) {
    return { text: "Дедлайн завтра", urgent: true };
  }

  return { text: `До ${formatStudyDate(date)}`, urgent: false };
}
