import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { getDashboardStatus } from "../../features/dashboard/api/dashboard-api.ts";
import markerPurple from "../../assets/dashboard/02_dashboard_marker_purple_heading.png";
import markerGreen from "../../assets/dashboard/03_dashboard_marker_green_heading.png";
import dotsPurple from "../../assets/dashboard/07_dashboard_dots_purple.png";
import dotsBlue from "../../assets/dashboard/08_dashboard_dots_blue.png";
import dotsGreen from "../../assets/dashboard/09_dashboard_dots_green.png";
import dotsRed from "../../assets/dashboard/10_dashboard_dots_red.png";
import iconSubjects from "../../assets/dashboard/13_icon_subjects_purple.png";
import iconTasks from "../../assets/dashboard/14_icon_tasks_blue.png";
import iconCalendar from "../../assets/dashboard/15_icon_calendar_red.png";
import iconProgress from "../../assets/dashboard/16_icon_progress_green.png";
import iconOverdue from "../../assets/dashboard/17_icon_overdue_red.png";
import iconSuccess from "../../assets/dashboard/18_icon_success_green.png";
import sidebarDashboard from "../../assets/dashboard/21_sidebar_dashboard.png";
import sidebarSubjects from "../../assets/dashboard/22_sidebar_subjects.png";
import sidebarTasks from "../../assets/dashboard/23_sidebar_tasks.png";
import sidebarCalendar from "../../assets/dashboard/24_sidebar_calendar.png";
import sidebarProgress from "../../assets/dashboard/25_dashboard_sidebar_progress.png";
import sidebarSettings from "../../assets/dashboard/26_dashboard_sidebar_settings.png";
import deadlineEmpty from "../../assets/dashboard/27_empty_state_calendar_deadline.png";
import successEmpty from "../../assets/dashboard/28_empty_state_success_check.png";
import greenBlob from "../../assets/dashboard/29_accent_blob_green.png";
import pinkBlob from "../../assets/dashboard/30_accent_blob_pink.png";
import avatarLogan from "../../assets/shared/32_avatar_placeholder_logan.png";
import dotYellow from "../../assets/dashboard/33_status_dot_yellow.png";
import dotBlue from "../../assets/dashboard/34_status_dot_blue.png";
import chevronDown from "../../assets/dashboard/38_chevron_down.png";
import raysPurple from "../../assets/dashboard/39_dashboard_rays_purple.png";
import raysRed from "../../assets/dashboard/40_rays_red.png";

const sidebarItems = [
  { label: "Dashboard", icon: sidebarDashboard, to: "/dashboard", active: true },
  { label: "Subjects", icon: sidebarSubjects, to: "/subjects" },
  { label: "Tasks", icon: sidebarTasks, to: "/tasks" },
  { label: "Calendar", icon: sidebarCalendar, to: "/tasks" },
  { label: "Notes", icon: iconTasks, to: "/subjects" },
  { label: "Progress", icon: sidebarProgress, to: "/dashboard" },
  { label: "Settings", icon: sidebarSettings, to: "/dashboard" },
];

function formatPercent(value: number) {
  return `${value.toFixed(value % 1 === 0 ? 0 : 2)}%`;
}

function formatCount(value: number | undefined) {
  return String(value ?? 0);
}

export function DashboardPage() {
  const dashboardQuery = useQuery({
    queryKey: ["dashboard"],
    queryFn: getDashboardStatus,
  });

  const dashboard = dashboardQuery.data;
  const completionPercent = dashboard?.completion_percent ?? 0;
  const overdueCount = dashboard?.overdue_tasks.length ?? 0;
  const nearestTask = dashboard?.nearest_deadline_task;

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
        <DashboardSidebar />

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

function DashboardSidebar() {
  return (
    <aside className="hidden min-h-[calc(100vh-92px)] border-r border-[#e1e6ef] bg-white px-5 py-8 lg:flex lg:flex-col">
      <nav className="grid gap-5">
        {sidebarItems.map((item) => (
          <Link
            key={item.label}
            to={item.to}
            className={`flex h-14 items-center gap-5 rounded-[8px] px-5 text-base font-semibold transition ${
              item.active
                ? "bg-[#f3edff] text-[#5d20d8]"
                : "text-[#152139] hover:bg-[#f6f8fc] hover:text-[#5d20d8]"
            }`}
          >
            <img src={item.icon} alt="" aria-hidden="true" className="size-7 shrink-0" />
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="mt-auto">
        <div className="rounded-[8px] bg-[#f5f1ff] px-6 py-8 text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-[8px] text-[#6f2bd9]">
            <span className="text-5xl leading-none">✧</span>
          </div>
          <p className="text-base font-bold leading-snug text-[#5d20d8]">Focus on what matters.</p>
        </div>

        <button
          className="mt-8 flex h-14 w-full items-center justify-between rounded-[8px] border border-[#dce2eb] bg-white px-4 shadow-sm"
          aria-label="Open profile menu"
        >
          <span className="flex items-center gap-3">
            <img src={avatarLogan} alt="" className="size-8 rounded-[8px]" />
            <span className="font-semibold">Logan</span>
          </span>
          <img src={chevronDown} alt="" aria-hidden="true" className="size-6" />
        </button>
      </div>
    </aside>
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
