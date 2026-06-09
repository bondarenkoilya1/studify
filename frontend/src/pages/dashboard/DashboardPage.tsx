import {
  formatPercent,
  useDashboardPage,
} from "../../features/dashboard/model/useDashboardPage.ts";
import { Sidebar } from "../../shared/ui/navigation/Sidebar.tsx";
import { dashboardAssets, dashboardSidebarItems } from "./dashboard.assets.ts";

const {
  avatarLogan,
  chevronDown,
  deadlineEmpty,
  dotBlue,
  dotYellow,
  dotsBlue,
  dotsGreen,
  dotsPurple,
  dotsRed,
  greenBlob,
  iconCalendar,
  iconOverdue,
  iconProgress,
  iconSubjects,
  iconSuccess,
  iconTasks,
  markerGreen,
  markerPurple,
  pinkBlob,
  raysPurple,
  raysRed,
  successEmpty,
} = dashboardAssets;

function formatCount(value: number | undefined) {
  return String(value ?? 0);
}

export function DashboardPage() {
  const { completionPercent, dashboard, dashboardQuery, nearestTask, overdueCount } =
    useDashboardPage();

  const stats = [
    {
      title: "Subjects",
      value: formatCount(dashboard?.total_subjects),
      caption: "Study areas",
      icon: iconSubjects,
      dots: dotsPurple,
      border: "border-[#7c3df0]",
      valueClass: "text-black",
    },
    {
      title: "Tasks",
      value: formatCount(dashboard?.total_tasks),
      caption: "Created tasks",
      icon: iconTasks,
      dots: dotsBlue,
      border: "border-[#4d8dff]",
      valueClass: "text-black",
    },
    {
      title: "Completion",
      value: formatPercent(completionPercent),
      caption:
        completionPercent > 0
          ? `${dashboard?.total_completed_tasks ?? 0} tasks completed`
          : "No tasks completed yet",
      icon: iconProgress,
      dots: dotsGreen,
      border: "border-[#63be83]",
      valueClass: "text-[#158c55]",
      progress: completionPercent,
    },
    {
      title: "Overdue",
      value: formatCount(overdueCount),
      caption: overdueCount > 0 ? "Need review" : "Everything is on time",
      icon: iconOverdue,
      dots: dotsRed,
      border: "border-[#ff5b82]",
      valueClass: "text-[#dd144d]",
      iconVariant: "overdue" as const,
    },
  ];

  return (
    <div className="min-h-screen bg-white text-[#08111f]">
      <div className="mx-auto grid min-h-[calc(100vh-92px)] w-full max-w-[1584px] lg:grid-cols-[250px_1fr]">
        <Sidebar
          items={dashboardSidebarItems}
          avatar={avatarLogan}
          chevron={chevronDown}
          footerMessage="Focus on what matters."
          itemTextClassName="text-[#152139]"
        />

        <main className="relative overflow-hidden px-5 py-8 sm:px-8 lg:px-8 lg:py-12">
          <img
            src={dotsPurple}
            alt=""
            aria-hidden="true"
            className="absolute right-10 top-8 hidden w-[92px] opacity-70 xl:block"
          />

          <section className="grid gap-8 xl:grid-cols-[minmax(0,650px)_380px] xl:items-start xl:justify-between">
            <div className="relative">
              <img
                src={raysPurple}
                alt=""
                aria-hidden="true"
                className="absolute left-[-60px] top-8 hidden w-[64px] lg:block"
              />
              <img
                src={raysRed}
                alt=""
                aria-hidden="true"
                className="absolute right-[-12px] top-[120px] hidden w-[64px] lg:block"
              />

              <h1 className="max-w-[650px] text-[clamp(3rem,4vw,3.7rem)] font-black leading-[0.98] tracking-[-0.01em]">
                <span className="block">Study clearly.</span>
                <span className="block sm:whitespace-nowrap">
                  <span className="relative -ml-2 inline-block px-3">
                    <img
                      src={markerPurple}
                      alt=""
                      aria-hidden="true"
                      className="absolute inset-x-0 top-1/2 -z-0 h-[0.72em] w-full -translate-y-1/2"
                    />
                    <span className="relative z-10">Collaborate</span>
                  </span>{" "}
                  <span className="relative inline-block px-3">
                    <img
                      src={markerGreen}
                      alt=""
                      aria-hidden="true"
                      className="absolute inset-x-0 top-1/2 -z-0 h-[0.72em] w-full -translate-y-1/2"
                    />
                    <span className="relative z-10">effortlessly.</span>
                  </span>
                </span>
              </h1>

              <p className="mt-6 max-w-[430px] text-xl leading-[1.55] text-[#5c6b82]">
                Track tasks, completion, upcoming work, and overdue study items.
              </p>
            </div>

            <TodayCard
              ongoing={formatCount(dashboard?.total_ongoing_tasks)}
              waiting={formatCount(dashboard?.total_not_completed_tasks)}
            />
          </section>

          {dashboardQuery.error ? (
            <p className="mt-8 rounded-[8px] border border-[#ffb3c4] bg-[#fff3f6] px-5 py-4 text-sm font-semibold text-[#c21646]">
              Failed to load dashboard: {dashboardQuery.error.message}
            </p>
          ) : null}

          <section className="mt-12 grid gap-7 md:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat) => (
              <StatTile key={stat.title} {...stat} />
            ))}
          </section>

          <section className="mt-7 grid gap-7 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <NextDeadlineCard
              title={nearestTask?.name ?? "No upcoming tasks"}
              detail={
                nearestTask
                  ? "This is your nearest unfinished task."
                  : "Add a task with a future deadline and it will appear here."
              }
            />
            <OverdueSummaryCard overdueCount={overdueCount} />
          </section>
        </main>
      </div>
    </div>
  );
}

function TodayCard({ ongoing, waiting }: { ongoing: string; waiting: string }) {
  return (
    <article className="rounded-[22px] border border-[#d3dbe8] bg-white p-6 shadow-[0_20px_60px_rgba(27,39,63,0.08)]">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black">Today</h2>
        <img src={iconCalendar} alt="" aria-hidden="true" className="size-12" />
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <TodayMetric label="Ongoing" value={ongoing} dot={dotYellow} className="bg-[#fff6dd]" />
        <TodayMetric label="Waiting" value={waiting} dot={dotBlue} className="bg-[#eaf3ff]" />
      </div>
    </article>
  );
}

function TodayMetric({
  className,
  dot,
  label,
  value,
}: {
  className: string;
  dot: string;
  label: string;
  value: string;
}) {
  return (
    <div className={`rounded-[12px] p-5 ${className}`}>
      <div className="flex items-center gap-2 text-base font-semibold">
        <img src={dot} alt="" aria-hidden="true" className="size-4" />
        {label}
      </div>
      <p className="mt-6 text-5xl font-black leading-none">{value}</p>
    </div>
  );
}

function StatTile({
  border,
  caption,
  dots,
  icon,
  iconVariant = "default",
  progress,
  title,
  value,
  valueClass,
}: {
  border: string;
  caption: string;
  dots: string;
  icon: string;
  iconVariant?: "default" | "overdue";
  progress?: number;
  title: string;
  value: string;
  valueClass: string;
}) {
  return (
    <article
      className={`relative min-h-[212px] overflow-hidden rounded-[12px] border-2 bg-white p-6 shadow-[0_18px_50px_rgba(28,40,65,0.04)] ${border}`}
    >
      <div className="flex items-center gap-5">
        {iconVariant === "overdue" ? (
          <span className="flex size-13 items-center justify-center rounded-[12px] bg-[#ffd9e3]">
            <span className="flex size-7 items-center justify-center rounded-full border-[3px] border-[#ff375f] text-lg font-black leading-none text-[#ff375f]">
              !
            </span>
          </span>
        ) : (
          <img src={icon} alt="" aria-hidden="true" className="size-13" />
        )}
        <h2 className="text-xl font-black">{title}</h2>
      </div>

      <img
        src={dots}
        alt=""
        aria-hidden="true"
        className="absolute right-6 top-[74px] w-[56px] opacity-80"
      />

      <p className={`mt-7 text-5xl font-black leading-none ${valueClass}`}>{value}</p>
      <p className="mt-3 text-base font-medium text-[#43516a]">{caption}</p>

      {progress !== undefined ? (
        <div className="mt-5 h-2 overflow-hidden rounded-full bg-[#e4e8f0]">
          <div
            className="h-full rounded-full bg-[#158c55]"
            style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
          />
        </div>
      ) : null}
    </article>
  );
}

function NextDeadlineCard({ detail, title }: { detail: string; title: string }) {
  return (
    <article className="relative min-h-[236px] overflow-hidden rounded-[12px] border-2 border-[#ffb5c5] bg-white p-7 shadow-[0_18px_50px_rgba(28,40,65,0.04)]">
      <img
        src={pinkBlob}
        alt=""
        aria-hidden="true"
        className="absolute bottom-0 left-10 w-[300px] opacity-80"
      />
      <div className="relative z-10 flex items-start gap-5">
        <img src={iconCalendar} alt="" aria-hidden="true" className="size-12" />
        <h2 className="pt-2 text-lg font-black">Next deadline</h2>
      </div>

      <div className="relative z-10 mt-5 grid gap-6 sm:grid-cols-[260px_1fr] sm:items-center">
        <img src={deadlineEmpty} alt="" className="w-[260px]" />
        <div>
          <h3 className="text-2xl font-black">{title}</h3>
          <p className="mt-3 max-w-[310px] text-base leading-7 text-[#40506b]">{detail}</p>
        </div>
      </div>
    </article>
  );
}

function OverdueSummaryCard({ overdueCount }: { overdueCount: number }) {
  const title = overdueCount > 0 ? `${overdueCount} overdue tasks` : "No overdue tasks. Nice.";
  const detail = overdueCount > 0 ? "Review them when you can." : "You're on track.";

  return (
    <article className="relative min-h-[236px] overflow-hidden rounded-[12px] border-2 border-[#80cf95] bg-white p-7 shadow-[0_18px_50px_rgba(28,40,65,0.04)]">
      <img
        src={greenBlob}
        alt=""
        aria-hidden="true"
        className="absolute bottom-0 right-0 w-[360px] opacity-85"
      />
      <img
        src={dotsRed}
        alt=""
        aria-hidden="true"
        className="absolute right-[-20px] top-[90px] w-[86px] opacity-60"
      />

      <div className="relative z-10 flex items-start gap-5">
        <img src={iconSuccess} alt="" aria-hidden="true" className="size-12" />
        <h2 className="pt-2 text-lg font-black">Overdue</h2>
      </div>

      <div className="relative z-10 mt-5 grid gap-6 sm:grid-cols-[240px_1fr] sm:items-center">
        <img src={successEmpty} alt="" className="w-[240px]" />
        <div>
          <h3 className="text-2xl font-black">{title}</h3>
          <p className="mt-5 text-2xl text-[#40506b]">{detail}</p>
          <span className="mt-3 block h-1 w-28 rounded-full bg-[#22a35c]" />
        </div>
      </div>
    </article>
  );
}
