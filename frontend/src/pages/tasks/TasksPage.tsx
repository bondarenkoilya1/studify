import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { TaskForm } from "../../features/tasks/ui/TaskForm.tsx";
import { getSubjects } from "../../features/subjects/api/subjects-api.ts";
import { createTask, getTasks } from "../../features/tasks/api/tasks-api.ts";
import { type CreateTaskPayload } from "../../entities/task/types.ts";
import { getStatusClass, getStatusLabel } from "../../shared/lib/taskStatus.ts";
import { SectionHeader } from "../../shared/ui/SectionHeader.tsx";
import { StatCard } from "../../shared/ui/StatCard.tsx";
import { AppLayout } from "../../widgets/app-layout/AppLayout.tsx";

export function TasksPage() {
  const queryClient = useQueryClient();
  const subjectsQuery = useQuery({
    queryKey: ["subjects"],
    queryFn: getSubjects,
  });
  const tasksQuery = useQuery({
    queryKey: ["tasks"],
    queryFn: getTasks,
  });
  const createTaskMutation = useMutation({
    mutationFn: createTask,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks"] }),
  });

  const subjects = subjectsQuery.data ?? [];
  const tasks = tasksQuery.data ?? [];
  const subjectNames = new Map(subjects.map((subject) => [subject.id, subject.name]));
  const openTasks = tasks.filter((task) => task.status !== "completed");
  const ongoingTasks = tasks.filter((task) => task.status === "ongoing");
  const completedTasks = tasks.filter((task) => task.status === "completed");

  const taskStats = [
    {
      label: "Open tasks",
      value: tasksQuery.isLoading ? "..." : String(openTasks.length),
      detail: "Need attention",
    },
    {
      label: "In progress",
      value: tasksQuery.isLoading ? "..." : String(ongoingTasks.length),
      detail: "Currently active",
    },
    {
      label: "Completed",
      value: tasksQuery.isLoading ? "..." : String(completedTasks.length),
      detail: "Recently closed",
    },
  ];

  async function handleCreateTask(task: CreateTaskPayload) {
    await createTaskMutation.mutateAsync(task);
  }

  return (
    <AppLayout>
      <section className="grid gap-8">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">Tasks</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">
            Plan and track study work
          </h1>
          <p className="mt-4 text-lg leading-8 text-slate-600">
            Create study tasks, connect them to subjects, and keep deadlines visible from the
            backend data.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {taskStats.map((stat) => (
            <StatCard key={stat.label} {...stat} />
          ))}
        </div>

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
          <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <SectionHeader
              eyebrow="Task board"
              title="All tasks"
              description="Live task rows from the Go backend."
            />

            <div className="mt-6 overflow-hidden rounded-lg border border-slate-200">
              <div className="grid grid-cols-[1fr_140px_120px] gap-4 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <span>Task</span>
                <span>Deadline</span>
                <span>Status</span>
              </div>

              <div className="divide-y divide-slate-100 bg-white">
                {tasksQuery.isLoading ? (
                  <p className="px-4 py-5 text-sm text-slate-600">Loading tasks...</p>
                ) : null}

                {tasksQuery.error ? (
                  <p className="m-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    Failed to load tasks: {tasksQuery.error.message}
                  </p>
                ) : null}

                {!tasksQuery.isLoading && !tasksQuery.error && tasks.length === 0 ? (
                  <p className="px-4 py-5 text-sm text-slate-600">
                    No tasks yet. Create your first study task.
                  </p>
                ) : null}

                {!tasksQuery.isLoading && !tasksQuery.error
                  ? tasks.map((task) => (
                      <article
                        key={task.id}
                        className="grid gap-3 px-4 py-4 sm:grid-cols-[1fr_140px_120px] sm:items-center"
                      >
                        <div>
                          <h3 className="text-sm font-semibold text-slate-950">{task.name}</h3>
                          <p className="mt-1 text-sm text-slate-500">
                            {subjectNames.get(task.subject_id) ?? `Subject ${task.subject_id}`}
                          </p>
                        </div>
                        <p className="text-sm font-medium text-slate-700">
                          {task.deadline || "No deadline"}
                        </p>
                        <span
                          className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(task.status)}`}
                        >
                          {getStatusLabel(task.status)}
                        </span>
                      </article>
                    ))
                  : null}
              </div>
            </div>
          </section>

          <TaskForm
            subjects={subjects}
            isSubjectsLoading={subjectsQuery.isLoading}
            subjectsError={subjectsQuery.error}
            isSubmitting={createTaskMutation.isPending}
            submitError={createTaskMutation.error}
            onSubmit={handleCreateTask}
          />
        </div>
      </section>
    </AppLayout>
  );
}
