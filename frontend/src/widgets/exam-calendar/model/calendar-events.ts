import type { EventInput } from "@fullcalendar/react";
import { addMinutes, formatISO } from "date-fns";
import type { Subject, Task } from "@/shared/api";
import { getSubjectPresentation } from "@/entities/subject/model/presentation";

export type CalendarView = "dayGridMonth" | "timeGridWeek" | "listMonth";

export function subjectToCalendarEvents(subjects: Subject[]): EventInput[] {
  return subjects
    .filter((subject) => subject.exam_date)
    .map((subject) => {
      const colors = getSubjectPresentation(subject.scope, subject.id);

      return {
        id: String(subject.id),
        title: subject.name,
        start: subject.exam_date!,
        allDay: true,
        backgroundColor: colors.backgroundColor,
        borderColor: colors.borderColor,
        textColor: "#18181b",
        extendedProps: {
          subjectId: subject.id,
          examType: subject.exam_type,
          scope: subject.scope,
          course: subject.course,
          term: subject.term,
        },
      };
    });
}

export function taskToCalendarEvents(
  tasks: Task[],
  subjects: Subject[],
): EventInput[] {
  const subjectsById = new Map(
    subjects.map((subject) => [subject.id, subject]),
  );

  return tasks.flatMap((task): EventInput[] => {
    if (task.status === "completed") return [];

    const start =
      task.scheduled_date ??
      task.scheduled_at ??
      task.deadline_date ??
      task.deadline;
    if (!start) return [];

    const isTimed = !task.scheduled_date && task.scheduled_at != null;
    const end = isTimed
      ? addMinutes(new Date(start), task.estimated_time ?? 60).toISOString()
      : undefined;
    const subject = subjectsById.get(task.subject_id);
    const presentation = subject
      ? getSubjectPresentation(subject.scope, subject.id)
      : null;

    const event: EventInput = {
      id: `task-${task.id}`,
      title: task.name,
      start: isTimed
        ? start
        : (task.scheduled_date ??
          task.deadline_date ??
          formatISO(new Date(start), { representation: "date" })),
      end,
      allDay: !isTimed,
      backgroundColor: presentation?.backgroundColor ?? "#f4f4f5",
      borderColor: presentation?.borderColor ?? "#a1a1aa",
      textColor: "#18181b",
      extendedProps: {
        kind: "task",
        subjectId: task.subject_id,
        subjectName: subject?.name ?? "Личное расписание",
        scope: subject?.scope,
        status: task.status,
        priority: task.priority,
        taskType: task.type,
      },
    };

    return [event];
  });
}
