import { differenceInCalendarDays, startOfDay } from "date-fns";

// The task form stores dates without a time as local midnight.
export function isDateOnlyTaskTime(date: Date) {
  return date.getTime() === startOfDay(date).getTime();
}

export function formatTaskDeadline(deadline: string, now = new Date()) {
  const date = new Date(deadline);
  const daysUntilDue = differenceInCalendarDays(date, now);
  const formatted = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  if (daysUntilDue < 0 || (date < now && !isDateOnlyTaskTime(date))) {
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
