import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { ArrowRight, CalendarDays } from "lucide-react";
import { currentUserQuery } from "@/entities/user";
import { buttonVariants } from "@/shared/ui/button";

export const Route = createFileRoute("/")({
  beforeLoad: async ({ context: { queryClient } }) => {
    const user = await queryClient
      .ensureQueryData(currentUserQuery)
      .catch(() => null);

    if (user) throw redirect({ to: "/dashboard", replace: true });
  },
  component: HomePage,
});

const week = [
  {
    date: "2026-12-07",
    day: "Пн",
    number: "07",
    title: "Подготовить отчёт",
    subject: "Физика",
    kind: "Работа",
    color: "bg-studify-wash text-studify-active",
  },
  {
    date: "2026-12-09",
    day: "Ср",
    number: "09",
    title: "Сдать отчёт",
    subject: "Физика",
    kind: "Дедлайн",
    color: "bg-amber-50 text-amber-900",
  },
  {
    date: "2026-12-11",
    day: "Пт",
    number: "11",
    title: "Экзамен по математике",
    subject: "Математика",
    kind: "Экзамен",
    color: "bg-muted text-foreground",
  },
];

function HomePage() {
  return (
    <div className="flex flex-1 items-center bg-studify-canvas text-studify-text">
      <div className="mx-auto grid w-full max-w-6xl items-center gap-10 px-5 py-12 sm:px-8 sm:py-16 lg:grid-cols-2 lg:gap-16 lg:py-24">
        <div className="max-w-2xl">
          <h1 className="text-[2.25rem] leading-[1.08] font-semibold tracking-[-0.045em] text-balance sm:text-5xl lg:text-6xl">
            Спланируйте учёбу на неделю
          </h1>
          <p className="mt-5 max-w-lg text-base leading-relaxed text-studify-muted sm:text-lg">
            Соберите предметы, задачи и экзамены в одном календаре. Отметьте,
            когда будете работать над заданием и к какому дню его нужно сдать.
          </p>
          <Link
            to="/register"
            className={buttonVariants({
              size: "lg",
              className: "mt-7 min-h-12 gap-2 px-5",
            })}
          >
            Начать
            <ArrowRight aria-hidden="true" />
          </Link>
        </div>

        <section
          aria-labelledby="example-week"
          className="w-full max-w-xl rounded-2xl border border-studify-border/70 bg-studify-surface"
        >
          <div className="flex items-center gap-3 border-b border-studify-border/60 px-4 py-4 sm:px-6 sm:py-5">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-studify-wash text-studify-active">
              <CalendarDays className="size-5" aria-hidden="true" />
            </span>
            <div>
              <h2 id="example-week" className="font-semibold sm:text-lg">
                Пример учебной недели
              </h2>
              <p className="text-sm text-studify-muted">7–13 декабря</p>
            </div>
          </div>

          <ul className="divide-y divide-studify-border/45 px-4 sm:px-6">
            {week.map((item) => (
              <li
                key={item.date}
                className="grid grid-cols-[2.5rem_minmax(0,1fr)] items-start gap-x-3 gap-y-1.5 py-4 sm:grid-cols-[2.5rem_minmax(0,1fr)_auto] sm:items-center"
              >
                <time
                  dateTime={item.date}
                  className="row-span-2 flex flex-col items-center sm:row-span-1"
                >
                  <span className="text-xs font-medium text-studify-muted">
                    {item.day}
                  </span>
                  <span className="text-xl leading-tight font-semibold tabular-nums">
                    {item.number}
                  </span>
                </time>
                <div>
                  <p className="text-sm font-semibold">{item.title}</p>
                  <p className="mt-0.5 text-xs text-studify-muted">
                    {item.subject}
                  </p>
                </div>
                <span
                  className={`w-fit rounded-md px-2 py-0.5 text-xs font-medium ${item.color}`}
                >
                  {item.kind}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
