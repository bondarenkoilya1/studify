import { createFileRoute } from "@tanstack/react-router";
import { useGetTasks } from "@/entities/task";
import type { Task } from "@/entities/task";
import type {
  TaskStatus,
  TaskType,
  TaskDifficulty,
  TaskPriority,
} from "@/entities/task/model/types";
import { useState } from "react";

export const Route = createFileRoute("/_protected/subjects/$name")({
  component: SubjectPage,
});

// ─────────────────────────────────────────────────────────────
// Config / labels
// ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  TaskStatus,
  { label: string; dot: string; text: string }
> = {
  not_completed: {
    label: "Not started",
    dot: "bg-gray-300",
    text: "text-gray-400",
  },
  ongoing: {
    label: "In progress",
    dot: "bg-[#0A84FF]",
    text: "text-[#0A84FF]",
  },
  completed: {
    label: "Completed",
    dot: "bg-[#30B855]",
    text: "text-[#2FA84A]",
  },
};

const TYPE_LABELS: Record<TaskType, string> = {
  exam: "Exam",
  credit: "Credit",
  coursework: "Coursework",
  project: "Project",
  other: "Other",
};

const DIFFICULTY_LEVEL: Record<TaskDifficulty, 1 | 2 | 3> = {
  low: 1,
  medium: 2,
  high: 3,
};

const DIFFICULTY_LABELS: Record<TaskDifficulty, string> = {
  low: "Easy",
  medium: "Medium",
  high: "Hard",
};

const PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

const PRIORITY_CHIP: Record<TaskPriority, { bg: string; text: string } | null> =
  {
    low: null,
    medium: {
      bg: "bg-amber-50",
      text: "text-amber-600",
    },
    high: {
      bg: "bg-red-50",
      text: "text-red-500",
    },
  };

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

// ─────────────────────────────────────────────────────────────
// Icons
// ─────────────────────────────────────────────────────────────

function IconTag() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-3.5 w-3.5 shrink-0"
    >
      <path d="M12.59 2.59a2 2 0 0 0-1.42-.59H4a2 2 0 0 0-2 2v7.17a2 2 0 0 0 .59 1.41l8 8a2 2 0 0 0 2.82 0l7.17-7.17a2 2 0 0 0 0-2.82Z" />
      <circle cx="7.5" cy="7.5" r="1.25" fill="currentColor" stroke="none" />
    </svg>
  );
}

function IconClock({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`shrink-0 ${className}`}
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" />
    </svg>
  );
}

function IconCalendar() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-3.5 w-3.5 shrink-0"
    >
      <rect x="3" y="4.5" width="18" height="16" rx="3" />
      <path d="M3 9.5h18M8 2.5v4M16 2.5v4" />
    </svg>
  );
}

function IconChevron({ expanded }: { expanded: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`h-3.5 w-3.5 transition-transform duration-200 ${
        expanded ? "rotate-180" : ""
      }`}
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────
// Difficulty
// ─────────────────────────────────────────────────────────────

function DifficultyBars({ difficulty }: { difficulty: TaskDifficulty }) {
  const level = DIFFICULTY_LEVEL[difficulty];
  const heights = [6, 9, 12];

  return (
    <span
      className="flex items-end gap-[2.5px]"
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

// ─────────────────────────────────────────────────────────────
// Task card
// ─────────────────────────────────────────────────────────────

function TaskCard({ task }: { task: Task }) {
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);

  const status = STATUS_CONFIG[task.status];
  const isDone = task.status === "completed";

  const deadline = task.deadline ? formatDeadline(task.deadline) : null;

  const priorityChip = PRIORITY_CHIP[task.priority];

  const hasLongDescription = Boolean(
    task.description && task.description.length > 140,
  );

  /*
   * scheduledAt is secondary to deadline.
   *
   * If a deadline exists, the card already communicates the
   * important date. scheduledAt only appears when there is no deadline.
   */
  const showScheduledAt = !deadline && Boolean(task.scheduledAt);

  return (
    <article
      className={`
        group relative overflow-hidden rounded-[20px]
        border border-black/[0.06]
        bg-white p-5 sm:p-6
        shadow-[0_1px_2px_rgba(0,0,0,0.03)]
        transition-all duration-200 ease-out
        cursor-pointer
        hover:border-black/[0.09]
        hover:shadow-[0_6px_18px_rgba(0,0,0,0.06)]
        ${isDone ? "opacity-[0.55]" : ""}
      `}
    >
      {/* Priority */}
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
          <IconClock className="h-3 w-3" />
          {PRIORITY_LABELS[task.priority]}
        </span>
      )}

      {/* Title */}
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

      {/* Description */}
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
              <IconChevron expanded={descriptionExpanded} />
            </button>
          )}
        </div>
      )}

      {/* Deadline */}
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

      {/*
        Bottom metadata.

        Default:
          type + difficulty

        Desktop hover:
          estimated time + scheduled date

        Mobile:
          everything remains visible because there is no hover.
      */}
      <div
        className="
          mt-4
          flex flex-wrap
          items-center
          gap-x-5 gap-y-2
          border-t border-black/[0.05]
          pt-3.5
          text-[12.5px]
          text-gray-500
        "
      >
        {/* Status only when meaningful.
            "Not started" is the default and therefore omitted. */}
        {task.status !== "not_completed" && (
          <span className={`flex items-center gap-1.5 ${status.text}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
            {status.label}
          </span>
        )}

        {/* Type */}
        <span className="flex items-center gap-1.5">
          <IconTag />
          {TYPE_LABELS[task.type]}
        </span>

        {/* Difficulty — bars only */}
        <DifficultyBars difficulty={task.difficulty} />

        {/* Secondary metadata.
            Visible on mobile, revealed on desktop hover. */}
        {task.estimatedTime !== null && (
          <span
            className="
              flex items-center gap-1.5
              sm:opacity-0
              sm:translate-y-1
              sm:transition-all
              sm:duration-200
              sm:group-hover:translate-y-0
              sm:group-hover:opacity-100
            "
          >
            <IconClock />~{task.estimatedTime} min
          </span>
        )}

        {showScheduledAt && (
          <span
            className="
              flex items-center gap-1.5
              sm:opacity-0
              sm:translate-y-1
              sm:transition-all
              sm:duration-200
              sm:group-hover:translate-y-0
              sm:group-hover:opacity-100
            "
          >
            <IconCalendar />
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

// ─────────────────────────────────────────────────────────────
// Empty state
// ─────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-28 text-center">
      <div
        className="
          mb-4
          flex h-11 w-11
          items-center justify-center
          rounded-full
          bg-gray-100
          text-gray-400
        "
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5"
        >
          <path d="M20 6 9 17l-5-5" />
        </svg>
      </div>

      <p className="text-[15px] font-medium text-gray-900">All clear</p>

      <p className="mt-1 text-[13px] text-gray-400">
        No tasks for this subject yet
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────

function SubjectPage() {
  const { name } = Route.useParams();
  const { data: tasks } = useGetTasks();

  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      <main className="mx-auto max-w-[640px] px-5 py-12 sm:px-8">
        {/* Page header */}
        <header>
          <h1
            className="
              text-[30px]
              font-semibold
              tracking-[-0.02em]
              text-gray-900
            "
          >
            {name}
          </h1>

          <p className="mt-1 text-[14px] text-gray-400">
            {tasks?.length ?? 0} {tasks?.length === 1 ? "task" : "tasks"}
          </p>
        </header>

        {/* Tasks */}
        <section className="mt-8 flex flex-col gap-3">
          {tasks && tasks.length > 0 ? (
            tasks.map((task) => <TaskCard key={task.id} task={task} />)
          ) : (
            <EmptyState />
          )}
        </section>
      </main>
    </div>
  );
}
