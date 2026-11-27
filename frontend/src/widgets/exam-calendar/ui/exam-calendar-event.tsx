import type { EventDisplayInfo } from "@fullcalendar/react";
import { EXAM_TYPE_LABELS } from "@/entities/subject";
import type { TaskEventKind } from "../model/calendar-events";

const taskLabels: Record<TaskEventKind, string> = {
  plan: "План",
  deadline: "Срок сдачи",
  "plan-and-deadline": "План и срок сдачи",
};

export function ExamCalendarEvent({ event, timeText, view }: EventDisplayInfo) {
  const { kind, examType, overdue, subjectName } = event.extendedProps as {
    kind?: TaskEventKind;
    examType?: keyof typeof EXAM_TYPE_LABELS;
    overdue?: boolean;
    subjectName?: string;
  };
  const label = kind
    ? taskLabels[kind]
    : examType && EXAM_TYPE_LABELS[examType];
  const description = [
    label,
    timeText,
    event.title,
    overdue && "Просрочено",
    subjectName,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="min-w-0 px-1 py-0.5" title={description}>
      <span
        className={`block text-[12px] leading-tight ${view.type === "listUpcoming" ? "wrap-anywhere whitespace-normal" : "truncate"}`}
      >
        {label && <span className="font-semibold">{label}: </span>}
        {timeText && <span>{timeText} · </span>}
        <span>{event.title}</span>
        {overdue && (
          <span className="font-semibold text-red-800"> · Просрочено</span>
        )}
      </span>
    </div>
  );
}
