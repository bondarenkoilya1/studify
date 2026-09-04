import type { Task } from "@/entities/task";
import { TaskCard } from "@/entities/task/ui/task-card";

interface TaskListProps {
  tasks?: Task[];
}

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

export function TaskList({ tasks }: TaskListProps) {
  if (!tasks?.length) {
    return <EmptyState />;
  }

  return (
    <section className="mt-8 flex flex-col gap-3">
      {tasks.map((task) => (
        <TaskCard key={task.id} task={task} />
      ))}
    </section>
  );
}
