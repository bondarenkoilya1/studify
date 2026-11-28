import type { EventInput } from "@fullcalendar/react";
import { addMinutes } from "date-fns";
import type { CalendarSubject, StudyPlanTask } from "@/shared/api";
import { getSubjectPresentation } from "@/entities/subject/model/presentation";
import { formatTaskDeadline } from "@/entities/task/model/dates";

export type AgendaView = "listMonth" | "listUpcoming";
export type CalendarView = "dayGridMonth" | "timeGridWeek" | AgendaView;
export type TaskEventKind = "plan" | "deadline" | "plan-and-deadline";

export function subjectToCalendarEvents(
  subjects: CalendarSubject[],
): EventInput[] {
  return subjects.flatMap((subject) => {
    if (!subject.exam_date) return [];
    const colors = getSubjectPresentation(subject.scope, subject.id);

    return [
      {
        id: `subject-${subject.id}`,
        title: subject.name,
        start: subject.exam_date,
        allDay: true,
        backgroundColor: colors.backgroundColor,
        borderColor: colors.borderColor,
        textColor: "#18181b",
        extendedProps: {
          subjectId: subject.id,
          examType: subject.exam_type,
          scope: subject.scope,
        },
      },
    ];
  });
}

export function taskToCalendarEvents(
  tasks: StudyPlanTask[],
  subjects: CalendarSubject[],
  now = new Date(),
): EventInput[] {
  const subjectsById = new Map(
    subjects.map((subject) => [subject.id, subject]),
  );

  return tasks.flatMap((task): EventInput[] => {
    if (task.status === "completed") return [];
    const plan = task.scheduled_date ?? task.scheduled_at;
    const due = task.deadline_date ?? task.deadline;
    if (!plan && !due) return [];

    const subject = subjectsById.get(task.subject_id);
    const colors = subject && getSubjectPresentation(subject.scope, subject.id);
    const overdue = formatTaskDeadline(task, now)?.overdue ?? false;

    function event(
      kind: TaskEventKind,
      start: string,
      allDay: boolean,
      end?: string,
    ): EventInput {
      return {
        id: `task-${task.id}-${kind}`,
        title: task.name,
        start,
        end,
        allDay,
        backgroundColor: colors?.backgroundColor ?? "#f4f4f5",
        borderColor: colors?.borderColor ?? "#a1a1aa",
        textColor: "#18181b",
        extendedProps: {
          kind,
          taskId: task.id,
          subjectId: task.subject_id,
          subjectName: subject?.name,
          scope: subject?.scope,
          overdue: kind !== "plan" && overdue,
        },
      };
    }

    if (task.scheduled_date && task.scheduled_date === task.deadline_date) {
      return [event("plan-and-deadline", task.scheduled_date, true)];
    }

    const events: EventInput[] = [];
    if (plan) {
      const allDay = Boolean(task.scheduled_date);
      const end = allDay
        ? undefined
        : addMinutes(new Date(plan), task.estimated_time ?? 60).toISOString();
      events.push(event("plan", plan, allDay, end));
    }
    if (due) {
      events.push(event("deadline", due, Boolean(task.deadline_date)));
    }
    return events;
  });
}
