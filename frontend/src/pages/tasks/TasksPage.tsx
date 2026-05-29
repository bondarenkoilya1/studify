import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { TaskForm } from "../../features/tasks/ui/TaskForm.tsx";
import { getSubjects } from "../../features/subjects/api/subjects-api.ts";
import { createTask, getTasks, updateTask } from "../../features/tasks/api/tasks-api.ts";
import { type CreateTaskPayload, type Task, type TaskStatus } from "../../entities/task/types.ts";
import { Card } from "../../shared/ui/Card.tsx";
import { PageHeader } from "../../shared/ui/PageHeader.tsx";
import { SectionHeader } from "../../shared/ui/SectionHeader.tsx";
import { StatCard } from "../../shared/ui/StatCard.tsx";
import { formatOptionalDate, isOverdueDate } from "../../shared/lib/dateFormat.ts";
import { getStatusClass, statusLabels } from "../../shared/lib/taskStatus.ts";
import { AppLayout } from "../../widgets/app-layout/AppLayout.tsx";

const taskStatusOptions: TaskStatus[] = ["not_completed", "ongoing", "completed"];

type StatusUpdateContext = {
  previousTasks?: Task[];
};

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Please try again.";
}

export function TasksPage() {
  const queryClient = useQueryClient();
  const [statusUpdateErrors, setStatusUpdateErrors] = useState<Record<number, string>>({});
  const [pendingStatusTaskId, setPendingStatusTaskId] = useState<number | null>(null);
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
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: ["tasks"] });

      const previousTasks = queryClient.getQueryData<Task[]>(["tasks"]);
      queryClient.setQueryData<Task[]>(["tasks"], (currentTasks) =>
        currentTasks?.map((task) =>
          task.id === variables.id ? { ...task, status: variables.status } : task,
        ),
      );

      setStatusUpdateErrors((current) => {
        const next = { ...current };
        delete next[variables.id];
        return next;
      });

      return { previousTasks };
    },
    onError: (_error, variables, context: StatusUpdateContext | undefined) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(["tasks"], context.previousTasks);
      }

      setStatusUpdateErrors((current) => ({
        ...current,
        [variables.id]: `Status was not saved. ${getErrorMessage(_error)}`,
      }));
    },
    onSuccess: (updatedTask, variables) => {
      queryClient.setQueryData<Task[]>(["tasks"], (currentTasks) =>
        currentTasks?.map((task) => (task.id === variables.id ? updatedTask : task)),
      );

      setStatusUpdateErrors((current) => {
        const next = { ...current };
        delete next[variables.id];
        return next;
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
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
    setPendingStatusTaskId(id);

    try {
      await updateTaskMutation.mutateAsync({ id, status });
    } catch {
      // Rollback and row-level messaging are handled by the mutation callbacks.
    } finally {
      setPendingStatusTaskId(null);
    }
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
                  ? tasks.map((task) => {
                      const isOverdue = task.status !== "completed" && isOverdueDate(task.deadline);

                      return (
                        <article
                          key={task.id}
                          className={`grid gap-3 border-l-4 px-4 py-4 transition sm:grid-cols-[1fr_140px_160px] sm:items-center ${
                            isOverdue
                              ? "border-l-red-500 bg-red-50/80 hover:bg-red-50"
                              : "border-l-transparent hover:bg-slate-50"
                          }`}
                        >
                          <div>
                            <h3
                              className={`text-sm font-semibold ${
                                isOverdue ? "text-red-900" : "text-[var(--color-text)]"
                              }`}
                            >
                              {task.name}
                            </h3>
                            <p
                              className={`mt-1 text-sm ${
                                isOverdue ? "text-red-700" : "text-[var(--color-text-muted)]"
                              }`}
                            >
                              {subjectNames.get(task.subject_id) ?? `Subject ${task.subject_id}`}
                            </p>
                          </div>
                          <div className="grid gap-1">
                            <p
                              className={`text-sm font-semibold ${
                                isOverdue ? "text-red-700" : "text-[var(--color-text-muted)]"
                              }`}
                            >
                              {formatOptionalDate(task.deadline, "No deadline")}
                            </p>
                            {isOverdue ? (
                              <span className="w-fit rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700 ring-1 ring-red-200">
                                Overdue
                              </span>
                            ) : null}
                          </div>
                          <label className="sr-only" htmlFor={`task-status-${task.id}`}>
                            Update status for {task.name}
                          </label>
                          <div className="grid gap-2">
                            <select
                              id={`task-status-${task.id}`}
                              value={task.status}
                              disabled={pendingStatusTaskId === task.id}
                              aria-invalid={Boolean(statusUpdateErrors[task.id])}
                              aria-describedby={
                                statusUpdateErrors[task.id]
                                  ? `task-status-error-${task.id}`
                                  : undefined
                              }
                              onChange={(event) =>
                                handleStatusChange(task.id, event.target.value as TaskStatus)
                              }
                              className={`h-10 rounded-xl border px-3 text-sm font-semibold shadow-sm outline-none ring-1 transition focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary-soft)] disabled:cursor-not-allowed disabled:bg-slate-100 ${
                                statusUpdateErrors[task.id]
                                  ? "border-red-300 ring-red-200"
                                  : "border-slate-300 ring-[var(--color-border)]"
                              } ${getStatusClass(task.status)}`}
                            >
                              {taskStatusOptions.map((status) => (
                                <option key={status} value={status}>
                                  {statusLabels[status]}
                                </option>
                              ))}
                            </select>
                            {statusUpdateErrors[task.id] ? (
                              <p
                                id={`task-status-error-${task.id}`}
                                className="rounded-lg border border-red-200 bg-[var(--color-danger-soft)] px-3 py-2 text-xs font-medium leading-5 text-red-700"
                              >
                                {statusUpdateErrors[task.id]}
                              </p>
                            ) : null}
                          </div>
                        </article>
                      );
                    })
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
