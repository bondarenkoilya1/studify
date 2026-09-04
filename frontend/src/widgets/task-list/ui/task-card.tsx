import { useState } from "react";
import { Calendar, ChevronDown, Clock, Flag } from "lucide-react";
import type { Task } from "@/entities/task";
import type { TaskDifficulty } from "@/entities/task/model/types";
import {
  DIFFICULTY_LABELS,
  DIFFICULTY_LEVEL,
  PRIORITY_CHIP,
  PRIORITY_LABELS,
  STATUS_CONFIG,
} from "../model/model";

interface TaskCardProps {
  task: Task;
}

function formatDeadline(deadline: string) {
  const date = new Date(deadline);
  const today = new Date();

  today.setHours(0, 0, 0, 0);

  const diffDays = Math.ceil((date.getTime() - today.getTime()) / 86_400_000);

  const formatted = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  if (diffDays === 0) {
    return {
      text: "Due today",
      urgent: true,
    };
  }

  if (diffDays === 1) {
    return {
      text: "Due tomorrow",
      urgent: true,
    };
  }

  if (diffDays < 0) {
    return {
      text: `${formatted} · overdue`,
      urgent: true,
    };
  }

  return {
    text: `Due ${formatted}`,
    urgent: false,
  };
}

function DifficultyBars({ difficulty }: { difficulty: TaskDifficulty }) {
  const level = DIFFICULTY_LEVEL[difficulty];
  const heights = [5, 8, 11];

  return (
    <span
      className="flex items-end gap-[2px]"
      title={DIFFICULTY_LABELS[difficulty]}
      aria-label={`Difficulty: ${DIFFICULTY_LABELS[difficulty]}`}
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

export function TaskCard({ task }: TaskCardProps) {
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);

  const status = STATUS_CONFIG[task.status];
  const isDone = task.status === "completed";

  const deadline = task.deadline ? formatDeadline(task.deadline) : null;

  const priorityChip = PRIORITY_CHIP[task.priority];

  const hasLongDescription = Boolean(
    task.description && task.description.length > 140,
  );

  const showScheduledAt = !deadline && Boolean(task.scheduledAt);

  return (
    <article
      className={`
        group relative cursor-pointer overflow-hidden rounded-[20px]
        border border-black/[0.06]
        bg-white p-5
        shadow-[0_1px_2px_rgba(0,0,0,0.03)]
        transition-all duration-200 ease-out
        hover:border-black/[0.09]
        hover:shadow-[0_6px_18px_rgba(0,0,0,0.06)]
        sm:p-6
        ${isDone ? "opacity-[0.55]" : ""}
      `}
    >
      {priorityChip && (
        <span
          className={`
            absolute right-0 top-0
            flex items-center gap-1
            rounded-bl-xl rounded-tr-[20px]
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
        className={`
          pr-16
          text-[16px] font-semibold leading-snug
          tracking-[-0.01em]
          ${isDone ? "text-gray-400 line-through" : "text-gray-900"}
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
              text-gray-500
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
                text-gray-400
                transition-colors
                hover:text-gray-600
              "
            >
              {descriptionExpanded ? "Show less" : "Show more"}

              <ChevronDown
                className={`h-3.5 w-3.5 transition-transform duration-200 ${
                  descriptionExpanded ? "rotate-180" : ""
                }`}
              />
            </button>
          )}
        </div>
      )}

      {deadline && (
        <p
          className={`
            mt-2.5
            text-[13px] font-medium
            ${
              isDone
                ? "text-gray-400"
                : deadline.urgent
                  ? "text-red-500"
                  : "text-gray-600"
            }
          `}
        >
          {deadline.text}
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-black/[0.05] pt-3.5 text-[12.5px] text-gray-500">
        {task.status !== "not_completed" && (
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

        {task.estimatedTime !== null && (
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
            <Clock className="h-3.5 w-3.5 shrink-0" />~{task.estimatedTime} min
          </span>
        )}

        {showScheduledAt && (
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
            <Calendar className="h-3.5 w-3.5 shrink-0" />
            {new Date(task.scheduledAt!).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </span>
        )}
      </div>
    </article>
  );
}
