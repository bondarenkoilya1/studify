import { createFileRoute } from "@tanstack/react-router";
import { useState, useTransition } from "react";
import {
  getGetStudyPlanQueryOptions,
  useGetStudyPlanSuspense,
} from "@/shared/api";
import { Button } from "@/shared/ui/button";
import { QuickTaskButton } from "@/features/task/create-task/ui/quick-task-button";
import { formatStudyDate } from "@/shared/lib/study-date";
import { getStudyPlan } from "@/widgets/dashboard/model/study-plan";
import { PlanSection } from "@/widgets/dashboard/ui/study-plan";

const overduePageSize = 10;
const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
const firstPage = { time_zone: timeZone, overdue_offset: 0 };

export const Route = createFileRoute("/_protected/dashboard")({
  loader: ({ context: { queryClient } }) =>
    queryClient.ensureQueryData(getGetStudyPlanQueryOptions(firstPage)),
  pendingComponent: DashboardSkeleton,
  component: DashboardPage,
});

function DashboardPage() {
  const [offset, setOffset] = useState(0);
  const [paging, startPaging] = useTransition();
  const { data } = useGetStudyPlanSuspense({
    ...firstPage,
    overdue_offset: offset,
  });
  const subjectNames = new Map(
    data.subjects.map((subject) => [subject.id, subject.name]),
  );
  const plan = getStudyPlan(data.tasks, new Date(data.as_of));

  function changePage(next: number) {
    startPaging(() => setOffset(next));
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-5 px-4 py-6 sm:px-6 sm:py-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">План</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {formatStudyDate(plan.weekStart)} — {formatStudyDate(plan.weekEnd)}
          </p>
        </div>
        <QuickTaskButton />
      </header>

      <div className="space-y-3">
        <PlanSection
          id="plan-overdue"
          title="Просрочено"
          empty={
            offset > 0
              ? "На этой странице задач нет."
              : "Просроченных задач нет."
          }
          tasks={data.overdue_tasks}
          subjectNames={subjectNames}
        >
          {(offset > 0 || data.overdue_total > overduePageSize) && (
            <div className="flex flex-wrap items-center justify-between gap-2 px-4 pb-3 text-sm sm:px-5">
              <span aria-live="polite" className="text-muted-foreground">
                {data.overdue_tasks.length > 0
                  ? `${offset + 1}–${offset + data.overdue_tasks.length} из ${data.overdue_total}`
                  : `Всего ${data.overdue_total}`}
              </span>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={paging || offset === 0}
                  onClick={() => changePage(offset - overduePageSize)}
                >
                  Назад
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={
                    paging || offset + overduePageSize >= data.overdue_total
                  }
                  onClick={() => changePage(offset + overduePageSize)}
                >
                  Дальше
                </Button>
              </div>
            </div>
          )}
        </PlanSection>
        <PlanSection
          id="plan-today"
          title="Сегодня"
          empty="На сегодня задач нет."
          tasks={plan.today}
          subjectNames={subjectNames}
        />
        <PlanSection
          id="plan-week"
          title="На неделе"
          empty="До конца недели задач нет."
          tasks={plan.week}
          subjectNames={subjectNames}
        />
        {plan.later.length > 0 && (
          <PlanSection
            id="plan-later"
            title="Позже и без даты"
            tasks={plan.later}
            subjectNames={subjectNames}
          />
        )}
      </div>

      <DashboardStats
        subjectCount={data.subjects.length}
        total={data.total_tasks}
        completed={data.total_completed_tasks}
        ongoing={data.total_ongoing_tasks}
      />
    </div>
  );
}

function DashboardStats({
  subjectCount,
  total,
  completed,
  ongoing,
}: {
  subjectCount: number;
  total: number;
  completed: number;
  ongoing: number;
}) {
  const percent = total ? Math.round((completed / total) * 100) : 0;
  const stats = [
    { label: "Предметов", value: subjectCount },
    { label: "Всего задач", value: total },
    { label: "В процессе", value: ongoing },
    { label: "Завершено", value: completed },
  ];

  return (
    <section
      aria-labelledby="dashboard-stats"
      className="space-y-3 rounded-2xl border bg-card p-4 sm:p-5"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="dashboard-stats" className="font-semibold">
          Статистика
        </h2>
        <span className="text-sm text-muted-foreground">
          {percent}% выполнено
        </span>
      </div>
      <progress
        value={completed}
        max={total || 1}
        aria-label="Выполнение задач"
        className="block h-2 w-full accent-primary"
      />
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map(({ label, value }) => (
          <div key={label}>
            <dt className="text-xs text-muted-foreground">{label}</dt>
            <dd className="text-base font-semibold tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function DashboardSkeleton() {
  return (
    <div
      role="status"
      className="mx-auto w-full max-w-4xl space-y-4 px-4 py-6 sm:px-6"
    >
      <span className="sr-only">Загружаем план</span>
      <div className="h-10 w-36 rounded bg-muted motion-safe:animate-pulse" />
      {[1, 2, 3].map((row) => (
        <div
          key={row}
          className="h-20 rounded-2xl border bg-muted motion-safe:animate-pulse"
        />
      ))}
    </div>
  );
}
