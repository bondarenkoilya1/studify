import { createFileRoute } from "@tanstack/react-router";
import {
  getGetUserSubjectsQueryOptions,
  getGetUserTasksQueryOptions,
  useGetUserSubjectsSuspense,
  useGetUserTasksSuspense,
} from "@/shared/api";
import { formatStudyDate } from "@/shared/lib/study-date";
import { getStudyPlan } from "@/widgets/dashboard/model/study-plan";
import { PlanSection } from "@/widgets/dashboard/ui/study-plan";

export const Route = createFileRoute("/_protected/dashboard")({
  loader: ({ context: { queryClient } }) =>
    Promise.all([
      queryClient.ensureQueryData(getGetUserSubjectsQueryOptions()),
      queryClient.ensureQueryData(getGetUserTasksQueryOptions()),
    ]),
  pendingComponent: DashboardSkeleton,
  component: DashboardPage,
});

function DashboardPage() {
  const { data: subjects } = useGetUserSubjectsSuspense();
  const { data: tasks } = useGetUserTasksSuspense();
  const subjectNames = new Map(
    subjects.map((subject) => [subject.id, subject.name]),
  );
  const plan = getStudyPlan(tasks);

  return (
    <div className="mx-auto w-full max-w-4xl space-y-5 px-4 py-6 sm:px-6 sm:py-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Дашборд</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {formatStudyDate(plan.weekStart)} — {formatStudyDate(plan.weekEnd)}
          </p>
        </div>
      </header>

      <div className="space-y-3">
        <PlanSection
          id="plan-overdue"
          title="Просрочено"
          empty="Просроченных задач нет."
          tasks={plan.overdue}
          subjectNames={subjectNames}
        />
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
        subjectCount={subjects.length}
        total={tasks.length}
        completed={plan.completed}
        ongoing={plan.ongoing}
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
