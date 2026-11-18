import type { EventInput } from "@fullcalendar/react";
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
  const subjectNames = new Map(
    subjects.map((subject) => [subject.id, subject.name]),
  );
  const subjectsById = new Map(subjects.map((subject) => [subject.id, subject]));

  return tasks.flatMap((task): EventInput[] => {
    if (task.status === "completed") return [];

    const start = task.scheduled_at ?? task.deadline;
    if (!start) return [];

    const startDate = new Date(start);
    const isTimed = Boolean(task.scheduled_at);
    const end = isTimed
      ? new Date(
          startDate.getTime() + (task.estimated_time ?? 60) * 60 * 1000,
        ).toISOString()
      : undefined;
    const subjectName =
      subjectNames.get(task.subject_id) ?? "Личное расписание";
    const subject = subjectsById.get(task.subject_id);
    const presentation = subject
      ? getSubjectPresentation(subject.scope, subject.id)
      : null;

    const event: EventInput = {
      id: `task-${task.id}`,
      title: task.name,
      start: isTimed ? start : startDate.toISOString().slice(0, 10),
      end,
      allDay: !isTimed,
      backgroundColor: presentation?.backgroundColor ?? "#f4f4f5",
      borderColor: presentation?.borderColor ?? "#a1a1aa",
      textColor: "#18181b",
      extendedProps: {
        kind: "task",
        subjectId: task.subject_id,
        subjectName,
        scope: subject?.scope,
        status: task.status,
        priority: task.priority,
        taskType: task.type,
      },
    };

    return [event];
  });
}
