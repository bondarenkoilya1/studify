import { createFileRoute } from "@tanstack/react-router";
import { useGetTasks } from "@/entities/task";
import { TaskList } from "@/widgets/task-list";

export const Route = createFileRoute("/_protected/subjects/$name")({
  component: SubjectPage,
});

function SubjectPage() {
  const { name } = Route.useParams();
  const { data: tasks } = useGetTasks();

  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      <main className="mx-auto max-w-[640px] px-5 py-12 sm:px-8">
        <header>
          <h1 className="text-[30px] font-semibold tracking-[-0.02em] text-gray-900">
            {name}
          </h1>

          <p className="mt-1 text-[14px] text-gray-400">
            {tasks?.length ?? 0} {tasks?.length === 1 ? "task" : "tasks"}
          </p>
        </header>

        <TaskList tasks={tasks} />
      </main>
    </div>
  );
}
