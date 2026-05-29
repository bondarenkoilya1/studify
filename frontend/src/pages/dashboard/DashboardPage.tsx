import { useQuery } from "@tanstack/react-query";
import { getDashboardStatus } from "../../features/dashboard/api/dashboard-api.ts";
import { PageHeader } from "../../shared/ui/PageHeader.tsx";
import { SectionHeader } from "../../shared/ui/SectionHeader.tsx";
import { StatCard } from "../../shared/ui/StatCard.tsx";
import { StatusBadge } from "../../shared/ui/StatusBadge.tsx";
import { formatOptionalDate } from "../../shared/lib/dateFormat.ts";
import { getStatusLabel } from "../../shared/lib/taskStatus.ts";
import { AppLayout } from "../../widgets/app-layout/AppLayout.tsx";

function formatPercent(value: number) {
  return `${value.toFixed(value % 1 === 0 ? 0 : 2)}%`;
}

function LoadingLine({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-full bg-slate-200/80 ${className}`} />;
}

export function DashboardPage() {
  const dashboardQuery = useQuery({
    queryKey: ["dashboard"],
    queryFn: getDashboardStatus,
  });

  const dashboard = dashboardQuery.data;
  const nearestTask = dashboard?.nearest_deadline_task;
  const overdueTasks = dashboard?.overdue_tasks ?? [];
  const completionPercent = dashboard?.completion_percent ?? 0;

  const dashboardStats = [
    {
      label: "Subjects",
      value: dashboardQuery.isLoading ? "..." : String(dashboard?.total_subjects ?? 0),
      detail: "Total study areas",
      icon: "S",
    },
    {
      label: "Tasks",
      value: dashboardQuery.isLoading ? "..." : String(dashboard?.total_tasks ?? 0),
      detail: "All created tasks",
      icon: "T",
    },
    {
      label: "Completion",
      value: dashboardQuery.isLoading ? "..." : formatPercent(completionPercent),
      detail: `${dashboard?.total_completed_tasks ?? 0} completed`,
      icon: "%",
      iconClassName: "bg-green-100 text-green-700",
      valueClassName: "text-green-700",
      progressValue: completionPercent,
      progressClassName: "bg-green-600",
    },
    {
      label: "Overdue",
      value: dashboardQuery.isLoading ? "..." : String(overdueTasks.length),
      detail: "Need review",
      icon: "!",
      iconClassName: "bg-red-100 text-red-700",
      valueClassName: "text-red-700",
    },
  ];

  return (
    <AppLayout>
      <section className="grid gap-8">
        <div className="grid gap-6 border-b border-[var(--color-border)] pb-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
          <PageHeader
            label="Dashboard"
            title="Study progress at a glance"
            description="Track tasks, completion, upcoming work, and overdue study items."
          />

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-soft)]">
              Current workload
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-[var(--color-warning-soft)] p-3">
                <p className="text-xs font-medium text-amber-800">Ongoing</p>
                <p className="mt-1 text-2xl font-semibold text-[var(--color-text)]">
                  {dashboardQuery.isLoading ? "..." : (dashboard?.total_ongoing_tasks ?? 0)}
                </p>
              </div>
              <div className="rounded-xl bg-[var(--color-primary-soft)] p-3">
                <p className="text-xs font-medium text-[var(--color-primary)]">Not Completed</p>
                <p className="mt-1 text-2xl font-semibold text-[var(--color-text)]">
                  {dashboardQuery.isLoading ? "..." : (dashboard?.total_not_completed_tasks ?? 0)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {dashboardQuery.error ? (
          <p className="rounded-xl border border-red-200 bg-[var(--color-danger-soft)] px-4 py-3 text-sm font-medium text-red-700 shadow-[var(--shadow-card)]">
            Failed to load dashboard: {dashboardQuery.error.message}
          </p>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {dashboardStats.map((stat) => (
            <StatCard key={stat.label} {...stat} />
          ))}
        </div>

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <section className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-white">
            <div className="border-b border-[var(--color-border)] px-5 py-4">
              <SectionHeader
                eyebrow="Next deadline"
                title="Upcoming unfinished task"
                description="The nearest task that is not completed and has a future deadline."
              />
            </div>

            <div className="p-5">
              {dashboardQuery.isLoading ? (
                <div className="grid gap-4">
                  <LoadingLine className="h-5 w-2/3" />
                  <LoadingLine className="h-4 w-1/2" />
                  <LoadingLine className="h-20 w-full rounded-xl" />
                </div>
              ) : null}

              {!dashboardQuery.isLoading && !dashboardQuery.error && !nearestTask ? (
                <div className="rounded-xl bg-[var(--color-surface-muted)] p-5">
                  <p className="text-sm font-semibold text-[var(--color-text)]">
                    No upcoming unfinished task.
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">
                    New future deadlines will appear here when you add them.
                  </p>
                </div>
              ) : null}

              {nearestTask ? (
                <article className="p-1">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                        Closest deadline
                      </p>
                      <h3 className="mt-2 text-xl font-semibold tracking-tight text-[var(--color-text)]">
                        {nearestTask.name}
                      </h3>
                    </div>
                    <StatusBadge status={nearestTask.status} />
                  </div>

                  <dl className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
                    <div className="border-t border-[var(--color-border)] pt-3">
                      <dt className="text-[var(--color-text-muted)]">Deadline</dt>
                      <dd className="mt-1 font-semibold text-[var(--color-text)]">
                        {formatOptionalDate(nearestTask.deadline, "No deadline")}
                      </dd>
                    </div>
                    <div className="border-t border-[var(--color-border)] pt-3">
                      <dt className="text-[var(--color-text-muted)]">Subject ID</dt>
                      <dd className="mt-1 font-semibold text-[var(--color-text)]">
                        {nearestTask.subject_id}
                      </dd>
                    </div>
                    <div className="border-t border-[var(--color-border)] pt-3">
                      <dt className="text-[var(--color-text-muted)]">Task ID</dt>
                      <dd className="mt-1 font-semibold text-[var(--color-text)]">
                        {nearestTask.id}
                      </dd>
                    </div>
                    <div className="border-t border-[var(--color-border)] pt-3">
                      <dt className="text-[var(--color-text-muted)]">Status</dt>
                      <dd className="mt-1 font-semibold text-[var(--color-text)]">
                        {getStatusLabel(nearestTask.status)}
                      </dd>
                    </div>
                  </dl>
                </article>
              ) : null}
            </div>
          </section>

          <section className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-white">
            <div className="flex flex-col gap-4 border-b border-[var(--color-border)] px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
              <SectionHeader
                eyebrow="Overdue"
                title="Tasks past deadline"
                description="Unfinished tasks whose deadline is earlier than the current backend time."
              />
              <span className="w-fit rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700 ring-1 ring-red-200">
                {overdueTasks.length} overdue
              </span>
            </div>

            <div className="p-5">
              {dashboardQuery.isLoading ? (
                <div className="grid gap-3">
                  <LoadingLine className="h-12 w-full rounded-xl" />
                  <LoadingLine className="h-12 w-full rounded-xl" />
                  <LoadingLine className="h-12 w-4/5 rounded-xl" />
                </div>
              ) : null}

              {!dashboardQuery.isLoading && !dashboardQuery.error && overdueTasks.length === 0 ? (
                <div className="rounded-xl bg-[var(--color-success-soft)] p-5">
                  <p className="text-sm font-semibold text-green-800">No overdue tasks.</p>
                  <p className="mt-2 text-sm leading-6 text-green-700">
                    Your unfinished tasks are still inside their deadlines.
                  </p>
                </div>
              ) : null}

              {overdueTasks.length > 0 ? (
                <div className="overflow-x-auto rounded-xl border border-[var(--color-border)]">
                  <div className="min-w-[620px]">
                    <div className="grid grid-cols-[1fr_140px_130px] gap-4 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                      <span>Task</span>
                      <span>Deadline</span>
                      <span>Status</span>
                    </div>

                    <div className="divide-y divide-slate-100 bg-white">
                      {overdueTasks.map((task) => (
                        <article
                          key={task.id}
                          className="grid grid-cols-[1fr_140px_130px] gap-4 px-4 py-4 transition hover:bg-slate-50"
                        >
                          <div>
                            <h3 className="text-sm font-semibold text-[var(--color-text)]">
                              {task.name}
                            </h3>
                            <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                              Subject ID {task.subject_id}
                            </p>
                          </div>
                          <p className="text-sm font-medium text-[var(--color-text-muted)]">
                            {formatOptionalDate(task.deadline, "No deadline")}
                          </p>
                          <div className="flex items-center">
                            <StatusBadge status={task.status} tone="overdue" />
                          </div>
                        </article>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </section>
        </div>
      </section>
    </AppLayout>
  );
}
