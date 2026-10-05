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
  size = 176,
  stroke = 16,
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
        <defs>
          <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366F1" />
            <stop offset="100%" stopColor="#8B5CF6" />
          </linearGradient>
        </defs>

        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#E5E5EA"
          strokeWidth={stroke}
        />

        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#ringGradient)"
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
        <span className="text-[38px] font-semibold tracking-[-0.03em] text-gray-900">
          {Math.round(animated)}%
        </span>

        <span className="text-[12px] font-medium text-gray-400">выполнено</span>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  tint,
}: {
  icon: typeof BookOpen;
  label: string;
  value: number;
  tint: {
    bg: string;
    fg: string;
  };
}) {
  return (
    <div className="rounded-2xl border border-black/[0.04] bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
      <div
        className="mb-3 flex size-9 items-center justify-center rounded-xl"
        style={{ backgroundColor: tint.bg }}
      >
        <Icon
          className="size-[18px]"
          style={{ color: tint.fg }}
          strokeWidth={2.25}
        />
      </div>

      <p className="text-[26px] font-semibold leading-none tracking-[-0.02em] text-gray-900">
        {value}
      </p>

      <p className="mt-1.5 text-[13px] text-gray-400">{label}</p>
    </div>
  );
}

export default function DashboardPage() {
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
        tint: {
          bg: "#EEF2FF",
          fg: "#6366F1",
        },
      },
      {
        icon: ListTodo,
        label: "Всего задач",
        value: dashboardStatus.total_tasks,
        tint: {
          bg: "#F3F0FF",
          fg: "#8B5CF6",
        },
      },
      {
        icon: Loader2,
        label: "В процессе",
        value: dashboardStatus.total_ongoing_tasks,
        tint: {
          bg: "#FFF7ED",
          fg: "#F59E0B",
        },
      },
      {
        icon: CheckCircle2,
        label: "Завершено",
        value: dashboardStatus.total_completed_tasks,
        tint: {
          bg: "#ECFDF5",
          fg: "#10B981",
        },
      },
    ];
  }, [dashboardStatus]);

  if (isLoading || !dashboardStatus) {
    return (
      <div className="min-h-screen bg-[#f5f5f7]">
        <main className="mx-auto max-w-[640px] px-5 py-12 sm:px-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 w-40 rounded-lg bg-black/[0.05]" />

            <div className="h-[220px] rounded-2xl bg-black/[0.05]" />

            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-[104px] rounded-2xl bg-black/[0.05]"
                />
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  const hasOverdue = dashboardStatus.overdue_tasks?.length > 0;

  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      <main className="mx-auto max-w-[640px] px-5 py-12 sm:px-8">
        <header className="mb-8">
          <h1 className="text-[30px] font-semibold tracking-[-0.02em] text-gray-900">
            Дашборд
          </h1>

          <p className="mt-1 text-[14px] text-gray-400">
            Обзор ваших предметов и задач
          </p>
        </header>

        {/* Hero: completion ring + quick summary */}
        <section className="mb-6 flex items-center gap-6 rounded-2xl border border-black/[0.04] bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)] sm:gap-8 sm:p-8">
          <CompletionRing percent={dashboardStatus.completion_percent} />

          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-medium uppercase tracking-wide text-gray-400">
              Прогресс
            </p>

            <p className="mt-1 text-[19px] font-semibold leading-snug tracking-[-0.01em] text-gray-900">
              {dashboardStatus.total_completed_tasks} из{" "}
              {dashboardStatus.total_tasks} задач завершено
            </p>

            <p className="mt-2 text-[13.5px] leading-relaxed text-gray-400">
              {dashboardStatus.total_not_completed_tasks} не начато ·{" "}
              {dashboardStatus.total_ongoing_tasks} в процессе
            </p>
          </div>
        </section>

        {/* Stat grid */}
        <section className="mb-6 grid grid-cols-2 gap-3">
          {stats.map((stat) => (
            <StatCard key={stat.label} {...stat} />
          ))}
        </section>

        {/* Nearest deadline */}
        {dashboardStatus.nearest_deadline_task && (
          <section className="mb-6">
            <h2 className="mb-3 text-[13px] font-medium uppercase tracking-wide text-gray-400">
              Ближайший дедлайн
            </h2>

            <div className="group rounded-2xl border border-black/[0.04] bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h3 className="truncate text-[16px] font-semibold tracking-[-0.01em] text-gray-900">
                    {dashboardStatus.nearest_deadline_task.name}
                  </h3>

                  {dashboardStatus.nearest_deadline_task.description && (
                    <p className="mt-1 line-clamp-2 text-[13.5px] text-gray-400">
                      {dashboardStatus.nearest_deadline_task.description}
                    </p>
                  )}
                </div>

                <ArrowUpRight className="mt-0.5 size-4 shrink-0 text-gray-300 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </div>

              <div className="mt-4 flex items-center gap-1.5 text-[12.5px] font-medium text-indigo-600">
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

        {/* Overdue tasks */}
        <section>
          <h2 className="mb-3 text-[13px] font-medium uppercase tracking-wide text-gray-400">
            Просроченные задачи
          </h2>

          {!hasOverdue ? (
            <div className="flex items-center gap-3 rounded-2xl border border-black/[0.04] bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#ECFDF5]">
                <CheckCircle2
                  className="size-[18px] text-emerald-500"
                  strokeWidth={2.25}
                />
              </div>

              <p className="text-[13.5px] text-gray-500">
                Просроченных задач нет — всё под контролем.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {dashboardStatus.overdue_tasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-start gap-3 rounded-2xl border border-red-500/[0.08] bg-red-500/[0.03] p-4"
                >
                  <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-red-500/10">
                    <AlertTriangle
                      className="size-4 text-red-500"
                      strokeWidth={2.25}
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14.5px] font-medium text-gray-900">
                      {task.name}
                    </p>

                    {task.description && (
                      <p className="mt-0.5 line-clamp-1 text-[13px] text-gray-400">
                        {task.description}
                      </p>
                    )}
                  </div>

                  <span className="mt-0.5 shrink-0 text-[12px] font-medium text-red-500">
                    {formatRelativeDeadline(task.deadline)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
