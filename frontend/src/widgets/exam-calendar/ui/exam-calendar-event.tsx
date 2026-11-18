import type { EventDisplayInfo } from "@fullcalendar/react";
import { EXAM_TYPE_LABELS } from "@/entities/subject";
import { getSubjectPresentation } from "@/entities/subject/model/presentation";

export function ExamCalendarEvent({ event, color }: EventDisplayInfo) {
  const kind = event.extendedProps.kind as "task" | "subject" | undefined;
  const subjectName = event.extendedProps.subjectName as string | undefined;
  const examType = event.extendedProps.examType as
    | keyof typeof EXAM_TYPE_LABELS
    | undefined;
  const subjectId = event.extendedProps.subjectId as
    | string
    | number
    | undefined;
  const scope = event.extendedProps.scope as string | undefined;
  const presentation =
    subjectId !== undefined
      ? getSubjectPresentation(scope ?? "other", subjectId)
      : null;

  return (
    <div className="flex min-w-0 items-center gap-1.5 px-1 py-0.5">
      <span
        className="size-1.5 shrink-0 rounded-full"
        style={{
          backgroundColor:
            presentation?.borderColor ?? color ?? "#71717a",
        }}
      />
      <span className="min-w-0 truncate text-[12px] font-medium leading-tight">
        {event.title}
      </span>
      {kind === "task" && subjectName && (
        <span className="hidden truncate text-[10px] opacity-60 xl:inline">
          · {subjectName}
        </span>
      )}
      {!kind && examType && (
        <span className="hidden truncate text-[10px] opacity-60 xl:inline">
          · {EXAM_TYPE_LABELS[examType]}
        </span>
      )}
    </div>
  );
}
