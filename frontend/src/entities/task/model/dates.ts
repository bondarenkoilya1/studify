import { differenceInCalendarDays, isValid, parseISO } from "date-fns";
import type { Task } from "@/shared/api";
import { formatStudyDate } from "@/shared/lib/study-date";

export function getTaskDeadline(
  task: Pick<Task, "deadline" | "deadline_date">,
) {
  const value = task.deadline_date ?? task.deadline;
  if (!value) return null;

  const date = parseISO(value);
  return isValid(date) ? { date, allDay: Boolean(task.deadline_date) } : null;
}

export function isTaskDeadlineOverdue(
  deadline: NonNullable<ReturnType<typeof getTaskDeadline>>,
  now: Date,
) {
  return deadline.allDay
    ? differenceInCalendarDays(deadline.date, now) < 0
    : deadline.date < now;
}

export function formatTaskDeadline(
  task: Pick<Task, "deadline" | "deadline_date"> &
    Partial<Pick<Task, "status">>,
  now = new Date(),
) {
  const deadline = getTaskDeadline(task);
  if (!deadline) return null;

  const { date, allDay } = deadline;
  const daysUntilDue = differenceInCalendarDays(date, now);
  const dateLabel = formatStudyDate(date, allDay ? "d MMMM" : "d MMMM, HH:mm");

  if (task.status === "completed") {
    return { text: `Срок сдачи: ${dateLabel}`, overdue: false, urgent: false };
  }

  if (isTaskDeadlineOverdue(deadline, now)) {
    return { text: `${dateLabel} · просрочено`, overdue: true, urgent: true };
  }

  if (daysUntilDue === 0 || daysUntilDue === 1) {
    const day = daysUntilDue === 0 ? "сегодня" : "завтра";
    const time = allDay ? "" : `, ${formatStudyDate(date, "HH:mm")}`;
    return { text: `Сдать ${day}${time}`, overdue: false, urgent: true };
  }

  return { text: `Сдать до ${dateLabel}`, overdue: false, urgent: false };
}
