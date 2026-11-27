import { useEffect, useRef, useState } from "react";
import { formatStudyDate } from "@/shared/lib/study-date";
import { Calendar, ChevronDown, Clock, Flag } from "lucide-react";
import type { Task, TaskDifficulty } from "@/shared/api";
import { formatTaskDeadline } from "../model/dates";
import {
  DIFFICULTY_LABELS,
  DIFFICULTY_LEVEL,
  PRIORITY_CHIP,
  PRIORITY_LABELS,
  STATUS_CONFIG,
} from "../model/presentation";

interface TaskCardProps {
  task: Task;
  highlighted?: boolean;
  children?: React.ReactNode;
}

function DifficultyBars({ difficulty }: { difficulty: TaskDifficulty }) {
  const level = DIFFICULTY_LEVEL[difficulty];
  const heights = [5, 8, 11];

  return (
    <span
      className="flex items-end gap-[2px]"
      title={DIFFICULTY_LABELS[difficulty]}
      aria-label={`Сложность: ${DIFFICULTY_LABELS[difficulty]}`}
    >
      {heights.map((height, index) => (
        <span
          key={height}
          style={{ height }}
          className={`w-[3px] rounded-full ${
            index < level ? "bg-gray-500" : "bg-gray-200"
          }`}
        />
      ))}
    </span>
  );
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
      className={`
        group relative overflow-hidden rounded-2xl
        border border-border
        bg-card p-5
        shadow-sm
        transition-all duration-200 ease-out
        hover:border-ring/30
        hover:shadow-md
        sm:p-6
        ${highlighted ? "outline-2 outline-offset-2 outline-ring" : ""}
      `}
    >
      {priorityChip && (
        <span
          className={`
            absolute right-0 top-0
            flex items-center gap-1
            rounded-bl-xl rounded-tr-2xl
            px-3 py-1.5
            text-[11px] font-medium
            ${priorityChip.bg}
            ${priorityChip.text}
          `}
        >
          <Flag className="h-3 w-3 shrink-0" />
          {PRIORITY_LABELS[task.priority]}
        </span>
      )}

      <h3
        id={`task-heading-${task.id}`}
        className={`
          pr-16
          text-[16px] font-semibold leading-snug
          tracking-[-0.01em] wrap-anywhere
          ${isDone ? "text-muted-foreground line-through" : "text-foreground"}
        `}
      >
        {task.name}
      </h3>

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
              className="
                mt-1
                flex items-center gap-1
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

      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-border pt-3.5 text-[12.5px] text-muted-foreground">
        {!children && task.status !== "not_completed" && (
          <span className={`flex items-center gap-1.5 ${status.text}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
            {status.label}
          </span>
        )}

        <span
          className="flex items-center gap-2"
          title={DIFFICULTY_LABELS[task.difficulty]}
        >
          <DifficultyBars difficulty={task.difficulty} />
          <span>{DIFFICULTY_LABELS[task.difficulty]}</span>
        </span>

        {task.estimated_time !== null && (
          <span
            className="
              flex items-center gap-1.5
              sm:translate-y-1
              sm:opacity-0
              sm:transition-all
              sm:duration-200
              sm:group-hover:translate-y-0
              sm:group-hover:opacity-100
            "
          >
            <Clock className="h-3.5 w-3.5 shrink-0" />~{task.estimated_time} мин
          </span>
        )}
      </div>
      {children}
    </article>
  );
}
