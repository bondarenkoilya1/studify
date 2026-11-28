import {
  addDays,
  endOfWeek,
  parseISO,
  startOfDay,
  startOfWeek,
} from "date-fns";
import type { StudyPlanTask } from "@/shared/api";
import {
  getTaskDeadline,
  isTaskDeadlineOverdue,
} from "@/entities/task/model/dates";

export type PlanGroup = "overdue" | "today" | "week" | "later";

export function getStudyPlan(tasks: StudyPlanTask[], now = new Date()) {
  const today = startOfDay(now).getTime();
  const tomorrow = startOfDay(addDays(now, 1)).getTime();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
  const groups: Record<PlanGroup, { task: StudyPlanTask; order: number }[]> = {
    overdue: [],
    today: [],
    week: [],
    later: [],
  };

  let completed = 0;
  let ongoing = 0;

  for (const task of tasks) {
    if (task.status === "completed") {
      completed++;
      continue;
    }
    if (task.status === "ongoing") ongoing++;

    const deadline = getTaskDeadline(task);
    if (deadline && isTaskDeadlineOverdue(deadline, now)) {
      groups.overdue.push({ task, order: deadline.date.getTime() });
      continue;
    }

    const planned = task.scheduled_date ?? task.scheduled_at;
    const plannedTime = planned ? parseISO(planned).getTime() : NaN;
    const dates = [plannedTime, deadline?.date.getTime() ?? NaN];
    const next = Math.min(...dates.filter((date) => date >= today));

    if (next < tomorrow) {
      groups.today.push({ task, order: next });
    } else if (next <= weekEnd.getTime()) {
      groups.week.push({ task, order: next });
    } else {
      groups.later.push({
        task,
        order: Number.isFinite(next)
          ? next
          : Number.isFinite(plannedTime)
            ? plannedTime
            : Infinity,
      });
    }
  }

  const sortGroup = (group: PlanGroup) =>
    groups[group]
      .toSorted((a, b) => a.order - b.order || a.task.id - b.task.id)
      .map(({ task }) => task);

  return {
    weekStart,
    weekEnd,
    overdue: sortGroup("overdue"),
    today: sortGroup("today"),
    week: sortGroup("week"),
    later: sortGroup("later"),
    completed,
    ongoing,
  };
}
