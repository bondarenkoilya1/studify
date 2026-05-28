import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { TaskForm } from "../../features/tasks/ui/TaskForm.tsx";
import { getSubjects } from "../../features/subjects/api/subjects-api.ts";
import { createTask, getTasks, updateTask } from "../../features/tasks/api/tasks-api.ts";
import { type CreateTaskPayload, type TaskStatus } from "../../entities/task/types.ts";
import { Card } from "../../shared/ui/Card.tsx";
import { PageHeader } from "../../shared/ui/PageHeader.tsx";
import { SectionHeader } from "../../shared/ui/SectionHeader.tsx";
import { StatCard } from "../../shared/ui/StatCard.tsx";
import { statusLabels } from "../../shared/lib/taskStatus.ts";
import { AppLayout } from "../../widgets/app-layout/AppLayout.tsx";

const taskStatusOptions: TaskStatus[] = ["not_completed", "ongoing", "completed"];

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
  const updateTaskMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: TaskStatus }) => updateTask(id, { status }),
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
      icon: "O",
    },
    {
      label: "In progress",
      value: tasksQuery.isLoading ? "..." : String(ongoingTasks.length),
      detail: "Currently active",
      icon: "W",
      iconClassName: "bg-amber-100 text-amber-800",
    },
    {
      label: "Completed",
      value: tasksQuery.isLoading ? "..." : String(completedTasks.length),
      detail: "Recently closed",
      icon: "C",
      iconClassName: "bg-green-100 text-green-700",
      valueClassName: "text-green-700",
    },
  ];

  async function handleCreateTask(task: CreateTaskPayload) {
    await createTaskMutation.mutateAsync(task);
  }

  async function handleStatusChange(id: number, status: TaskStatus) {
    await updateTaskMutation.mutateAsync({ id, status });
  }

  return (
    <AppLayout>
      <section className="grid gap-8">
        <PageHeader
          label="Tasks"
          title="Plan and track study work"
          description="Create study tasks, connect them to subjects, and keep deadlines visible from the backend data."
        />

        <div className="grid gap-4 md:grid-cols-3">
          {taskStats.map((stat) => (
            <StatCard key={stat.label} {...stat} />
          ))}
        </div>

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
          <Card>
            <SectionHeader
              eyebrow="Task board"
              title="All tasks"
              description="Live task rows from the Go backend."
            />

            <div className="mt-6 overflow-hidden rounded-xl border border-[var(--color-border)]">
              <div className="grid grid-cols-[1fr_140px_160px] gap-4 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                <span>Task</span>
                <span>Deadline</span>
                <span>Status</span>
              </div>

              <div className="divide-y divide-slate-100 bg-white">
                {tasksQuery.isLoading ? (
                  <p className="px-4 py-5 text-sm text-[var(--color-text-muted)]">
                    Loading tasks...
                  </p>
                ) : null}

                {tasksQuery.error ? (
                  <p className="m-4 rounded-xl border border-red-200 bg-[var(--color-danger-soft)] px-3 py-2 text-sm text-red-700">
                    Failed to load tasks: {tasksQuery.error.message}
                  </p>
                ) : null}

                {!tasksQuery.isLoading && !tasksQuery.error && tasks.length === 0 ? (
                  <p className="px-4 py-5 text-sm text-[var(--color-text-muted)]">
                    No tasks yet. Create your first study task.
                  </p>
                ) : null}

                {!tasksQuery.isLoading && !tasksQuery.error
                  ? tasks.map((task) => (
                      <article
                        key={task.id}
                        className="grid gap-3 px-4 py-4 transition hover:bg-slate-50 sm:grid-cols-[1fr_140px_160px] sm:items-center"
                      >
                        <div>
                          <h3 className="text-sm font-semibold text-[var(--color-text)]">
                            {task.name}
                          </h3>
                          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                            {subjectNames.get(task.subject_id) ?? `Subject ${task.subject_id}`}
                          </p>
                        </div>
                        <p className="text-sm font-medium text-[var(--color-text-muted)]">
                          {task.deadline || "No deadline"}
                        </p>
                        <label className="sr-only" htmlFor={`task-status-${task.id}`}>
                          Update status for {task.name}
                        </label>
                        <select
                          id={`task-status-${task.id}`}
                          value={task.status}
                          disabled={updateTaskMutation.isPending}
                          onChange={(event) =>
                            handleStatusChange(task.id, event.target.value as TaskStatus)
                          }
                          className="h-10 rounded-xl border border-slate-300 bg-white px-3 text-sm font-medium text-[var(--color-text)] shadow-sm outline-none transition focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary-soft)] disabled:cursor-not-allowed disabled:bg-slate-100"
                        >
                          {taskStatusOptions.map((status) => (
                            <option key={status} value={status}>
                              {statusLabels[status]}
                            </option>
                          ))}
                        </select>
                      </article>
                    ))
                  : null}
              </div>
            </div>
          </Card>

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
