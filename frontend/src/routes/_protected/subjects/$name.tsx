import { createFileRoute } from "@tanstack/react-router";
import { useGetTasks } from "@/entities/task";
import type { Task } from "@/entities/task";
import type { TaskStatus } from "@/entities/task/model/types";

export const Route = createFileRoute("/_protected/subjects/$name")({
  component: SubjectPage,
});

const STATUS_CONFIG: Record<
  TaskStatus,
  { label: string; dot: string; badge: string }
> = {
  not_completed: {
    label: "Not started",
    dot: "bg-gray-400",
    badge: "bg-gray-100 text-gray-600",
  },
  ongoing: {
    label: "In progress",
    dot: "bg-blue-500",
    badge: "bg-blue-50 text-blue-600",
  },
  completed: {
    label: "Completed",
    dot: "bg-green-500",
    badge: "bg-green-50 text-green-600",
  },
};

function formatDeadline(deadline: string) {
  const date = new Date(deadline);
  const today = new Date();
  const diffDays = Math.ceil(
    (date.getTime() - today.setHours(0, 0, 0, 0)) / 86_400_000,
  );

  const formatted = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  if (diffDays === 0) return { text: "Today", urgent: true };
  if (diffDays === 1) return { text: "Tomorrow", urgent: true };
  if (diffDays < 0) return { text: `${formatted} · overdue`, urgent: true };
  return { text: formatted, urgent: false };
}

function TaskCard({ task }: { task: Task }) {
  const status = STATUS_CONFIG[task.status];
  const deadline = formatDeadline(task.deadline);
  const isDone = task.status === "completed";

  return (
    <div
      className="group relative rounded-2xl border border-black/5 bg-white/70
                 backdrop-blur-xl p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]
                 transition-all duration-200 hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)]
                 hover:-translate-y-0.5"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h3
            className={`text-[15px] font-semibold tracking-[-0.01em] text-gray-900 ${
              isDone ? "line-through text-gray-400" : ""
            }`}
          >
            {task.name}
          </h3>
          {task.description && (
            <p className="mt-1 text-[13px] leading-relaxed text-gray-500 line-clamp-2">
              {task.description}
            </p>
          )}
        </div>

        <span
          className={`shrink-0 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1
                      text-[11px] font-medium ${status.badge}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
          {status.label}
        </span>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <span
          className={`text-[12px] font-medium ${
            deadline.urgent && !isDone ? "text-red-500" : "text-gray-400"
          }`}
        >
          {deadline.text}
        </span>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="mb-3 h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center">
        <span className="text-2xl">✓</span>
      </div>
      <p className="text-[15px] font-medium text-gray-900">All clear</p>
      <p className="mt-1 text-[13px] text-gray-400">
        No tasks for this subject yet
      </p>
    </div>
  );
}

function SubjectPage() {
  const { name } = Route.useParams();
  const { data: tasks } = useGetTasks();

  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      <div className="mx-auto max-w-2xl px-6 py-10">
        <h1 className="text-[28px] font-semibold tracking-[-0.02em] text-gray-900">
          {name}
        </h1>
        <p className="mt-1 text-[15px] text-gray-500">
          {tasks?.length ?? 0} tasks
        </p>

        <div className="mt-8 flex flex-col gap-3">
          {tasks && tasks.length > 0 ? (
            tasks.map((task) => <TaskCard key={task.id} task={task} />)
          ) : (
            <EmptyState />
          )}
        </div>
      </div>
    </div>
  );
}
