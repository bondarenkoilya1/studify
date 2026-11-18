import { createFileRoute } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowUpRight,
  BookOpen,
  CheckCircle2,
  Clock3,
  ListTodo,
  Loader2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { formatRelativeDeadline, formatDate } from "@/widgets/dashboard";
import { useGetDashboardStatus } from "@/shared/api";

export const Route = createFileRoute("/_protected/dashboard")({
  component: RouteComponent,
});

function RouteComponent() {
  return <DashboardPage />;
}

function CompletionRing({
  percent,
  size = 160,
  stroke = 14,
}: {
  percent: number;
  size?: number;
  stroke?: number;
}) {
  const [animated, setAnimated] = useState(0);

  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (animated / 100) * circumference;

  useEffect(() => {
    const raf = requestAnimationFrame(() => setAnimated(percent));

    return () => cancelAnimationFrame(raf);
  }, [percent]);

  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`Выполнено ${percent}% задач`}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          className="stroke-muted"
          strokeWidth={stroke}
        />

        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          className="stroke-primary"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{
            transition: "stroke-dashoffset 1.1s cubic-bezier(.4,0,.2,1)",
          }}
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-semibold tracking-tight">
          {Math.round(animated)}%
        </span>

        <span className="mt-1 text-xs font-medium text-muted-foreground">
          выполнено
        </span>
      </div>
    </div>
  );
}

function DashboardPage() {
  const { data: dashboardStatus, isLoading } = useGetDashboardStatus();

  const stats = useMemo(() => {
    if (!dashboardStatus) {
      return [];
    }

    return [
      {
        icon: BookOpen,
        label: "Предметов",
        value: dashboardStatus.total_subjects,
        iconClass: "bg-primary/10 text-primary",
      },
      {
        icon: ListTodo,
        label: "Всего задач",
        value: dashboardStatus.total_tasks,
        iconClass: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
      },
      {
        icon: Loader2,
        label: "В процессе",
        value: dashboardStatus.total_ongoing_tasks,
        iconClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
      },
      {
        icon: CheckCircle2,
        label: "Завершено",
        value: dashboardStatus.total_completed_tasks,
        iconClass:
          "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
      },
    ];
  }, [dashboardStatus]);

  if (isLoading || !dashboardStatus) {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="flex flex-col gap-6">
          <div className="overflow-hidden rounded-2xl border bg-card shadow-xs">
            <div className="p-6 sm:p-8">
              <div className="h-11 w-11 animate-pulse rounded-2xl bg-muted" />
              <div className="mt-3 h-6 w-40 animate-pulse rounded bg-muted" />
              <div className="mt-2 h-4 w-64 max-w-full animate-pulse rounded bg-muted" />
            </div>
            <div className="grid border-t sm:grid-cols-2">
              {[1, 2].map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-3 border-t p-5 first:border-t-0 sm:px-8 sm:first:border-t-0 sm:[&:nth-child(2)]:border-l"
                >
                  <div className="size-9 animate-pulse rounded-xl bg-muted" />
                  <div className="space-y-2">
                    <div className="h-5 w-12 animate-pulse rounded bg-muted" />
                    <div className="h-3 w-24 animate-pulse rounded bg-muted" />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="h-52 animate-pulse rounded-2xl border bg-card shadow-xs" />
        </div>
      </div>
    );
  }

  const hasOverdue = dashboardStatus.overdue_tasks?.length > 0;

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="flex flex-col gap-6">
        <section className="overflow-hidden rounded-2xl border bg-card shadow-xs">
        <div className="relative p-6 sm:p-8">
          <div className="pointer-events-none absolute -right-20 -top-24 size-64 rounded-full bg-primary/10 blur-3xl" />

          <div className="relative flex flex-col items-center gap-5 text-center sm:flex-row sm:gap-8 sm:text-left">
            <CompletionRing percent={dashboardStatus.completion_percent} />

            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Прогресс
              </p>

              <p className="mt-1 text-xl font-semibold tracking-tight">
                {dashboardStatus.total_completed_tasks} из{" "}
                {dashboardStatus.total_tasks} задач завершено
              </p>

              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {dashboardStatus.total_not_completed_tasks} не начато ·{" "}
                {dashboardStatus.total_ongoing_tasks} в процессе
              </p>
            </div>
          </div>
        </div>

        <div className="grid border-t sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => {
            const Icon = stat.icon;

            return (
              <div
                key={stat.label}
                className={[
                  "flex items-center gap-3 border-t p-5 sm:px-6 lg:px-5",
                  index === 0 ? "border-t-0 sm:border-t-0" : "",
                  index >= 2 ? "sm:border-t" : "",
                  index % 2 === 1 ? "sm:border-l" : "",
                  "lg:border-t-0 lg:border-l",
                  index === 0 ? "lg:border-l-0" : "",
                ].join(" ")}
              >
                <div
                  className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${stat.iconClass}`}
                >
                  <Icon className="size-4" strokeWidth={2.25} />
                </div>
                <div>
                  <p className="text-2xl font-semibold leading-none">
                    {stat.value}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {stat.label}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        {dashboardStatus.nearest_deadline_task && (
          <section className="overflow-hidden rounded-2xl border bg-card shadow-xs">
            <div className="flex items-center justify-between gap-4 border-b px-6 py-4 sm:px-8">
              <div>
                <h2 className="font-semibold">Ближайший дедлайн</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Самая срочная задача
                </p>
              </div>
            </div>

            <div className="group px-6 py-5 sm:px-8">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h3 className="truncate font-medium">
                    {dashboardStatus.nearest_deadline_task.name}
                  </h3>

                  {dashboardStatus.nearest_deadline_task.description && (
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                      {dashboardStatus.nearest_deadline_task.description}
                    </p>
                  )}
                </div>

                <ArrowUpRight className="mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </div>

              <div className="mt-4 flex items-center gap-1.5 text-xs font-medium text-primary">
                <Clock3 className="size-3.5" strokeWidth={2.25} />

                <span>
                  {formatRelativeDeadline(
                    dashboardStatus.nearest_deadline_task.deadline,
                  )}{" "}
                  · {formatDate(dashboardStatus.nearest_deadline_task.deadline!)}
                </span>
              </div>
            </div>
          </section>
        )}

        <section
          className={`overflow-hidden rounded-2xl border bg-card shadow-xs ${
            dashboardStatus.nearest_deadline_task ? "" : "lg:col-span-2"
          }`}
        >
          <div className="flex items-center justify-between gap-4 border-b px-6 py-4 sm:px-8">
            <div>
              <h2 className="font-semibold">Просроченные задачи</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Требуют внимания
              </p>
            </div>
            {hasOverdue && (
              <span className="rounded-full bg-destructive/10 px-2.5 py-1 text-xs font-medium text-destructive">
                {dashboardStatus.overdue_tasks.length}
              </span>
            )}
          </div>

          {!hasOverdue ? (
            <div className="flex items-center gap-3 px-6 py-5 sm:px-8">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10">
                <CheckCircle2
                  className="size-4 text-emerald-600 dark:text-emerald-400"
                  strokeWidth={2.25}
                />
              </div>

              <p className="text-sm text-muted-foreground">
                Просроченных задач нет — всё под контролем.
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {dashboardStatus.overdue_tasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-start gap-3 px-6 py-4 transition-colors hover:bg-muted/30 sm:px-8"
                >
                  <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-red-500/10">
                    <AlertTriangle
                      className="size-4 text-destructive"
                      strokeWidth={2.25}
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {task.name}
                    </p>

                    {task.description && (
                      <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                        {task.description}
                      </p>
                    )}
                  </div>

                  <span className="mt-0.5 shrink-0 text-xs font-medium text-destructive">
                    {formatRelativeDeadline(task.deadline)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
      </div>
    </div>
  );
}
