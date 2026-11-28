import { useEffect, useRef, useState } from "react";
import { formatStudyDate } from "@/shared/lib/study-date";
import { Calendar, ChevronDown, Clock, Flag } from "lucide-react";
import type { Task } from "@/shared/api";
import { formatTaskDeadline } from "../model/dates";
import {
  DIFFICULTY_LABELS,
  PRIORITY_CHIP,
  PRIORITY_LABELS,
  STATUS_CONFIG,
} from "../model/presentation";

interface TaskCardProps {
  task: Task;
  highlighted?: boolean;
  children?: React.ReactNode;
}

export function TaskCard({
  task,
  highlighted = false,
  children,
}: TaskCardProps) {
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const cardRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (highlighted) cardRef.current?.focus();
  }, [highlighted]);

  const status = STATUS_CONFIG[task.status];
  const isDone = task.status === "completed";

  const deadline = formatTaskDeadline(task);

  const priorityChip = PRIORITY_CHIP[task.priority];

  const hasLongDescription = Boolean(
    task.description && task.description.length > 140,
  );

  const scheduled = task.scheduled_date ?? task.scheduled_at;

  return (
    <article
      ref={cardRef}
      tabIndex={highlighted ? -1 : undefined}
      aria-labelledby={`task-heading-${task.id}`}
      className={`rounded-2xl border bg-card p-4 sm:p-5
        ${highlighted ? "outline-2 outline-offset-2 outline-ring" : ""}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3
          id={`task-heading-${task.id}`}
          className={`min-w-0 text-base font-semibold leading-snug wrap-anywhere
          ${isDone ? "text-muted-foreground line-through" : "text-foreground"}`}
        >
          {task.name}
        </h3>
        {priorityChip && (
          <span
            className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium ${priorityChip.bg} ${priorityChip.text}`}
          >
            <Flag className="size-3 shrink-0" aria-hidden="true" />
            {PRIORITY_LABELS[task.priority]}
          </span>
        )}
      </div>

      {task.description && (
        <div className="mt-1.5">
          <p
            className={`
              text-[13.5px]
              leading-relaxed
              wrap-anywhere text-muted-foreground
              ${descriptionExpanded ? "" : "line-clamp-2"}
            `}
          >
            {task.description}
          </p>

          {hasLongDescription && (
            <button
              type="button"
              onClick={() => setDescriptionExpanded((expanded) => !expanded)}
              aria-expanded={descriptionExpanded}
              className="
                mt-1
                flex min-h-8 items-center gap-1
                text-[12px] font-medium
                text-muted-foreground
                transition-colors
                hover:text-foreground
              "
            >
              {descriptionExpanded ? "Свернуть" : "Подробнее"}

              <ChevronDown
                className={`h-3.5 w-3.5 transition-transform duration-200 ${
                  descriptionExpanded ? "rotate-180" : ""
                }`}
              />
            </button>
          )}
        </div>
      )}

      {scheduled && (
        <p className="mt-2.5 flex items-center gap-1.5 text-sm text-muted-foreground">
          <Calendar className="size-3.5 shrink-0" aria-hidden="true" />
          План:{" "}
          {formatStudyDate(
            scheduled,
            task.scheduled_date ? "d MMMM" : "d MMMM, HH:mm",
          )}
        </p>
      )}

      {deadline && (
        <p
          className={`
            mt-2.5
            text-[13px] font-medium
            ${
              isDone
                ? "text-muted-foreground"
                : deadline.urgent
                  ? "text-destructive"
                  : "text-foreground"
            }
          `}
        >
          {deadline.text}
        </p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
        {!children && task.status !== "not_completed" && (
          <span className={`flex items-center gap-1.5 ${status.text}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
            {status.label}
          </span>
        )}

        <span>
          Сложность {DIFFICULTY_LABELS[task.difficulty].toLowerCase()}
        </span>
        {task.estimated_time !== null && (
          <span className="inline-flex items-center gap-1">
            <Clock className="size-3.5 shrink-0" aria-hidden="true" />{" "}
            {task.estimated_time} мин
          </span>
        )}
      </div>
      {children}
    </article>
  );
}
