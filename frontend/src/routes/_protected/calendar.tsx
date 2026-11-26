import { createFileRoute } from "@tanstack/react-router";
import { CalendarDays } from "lucide-react";
import { ExamCalendar } from "@/widgets/exam-calendar";
import {
  getGetUserSubjectsQueryOptions,
  getGetUserTasksQueryOptions,
} from "@/shared/api";

export const Route = createFileRoute("/_protected/calendar")({
  loader: ({ context: { queryClient } }) =>
    Promise.all([
      queryClient.ensureQueryData(getGetUserSubjectsQueryOptions()),
      queryClient.ensureQueryData(getGetUserTasksQueryOptions()),
    ]),
  component: CalendarPage,
});

function CalendarPage() {
  return (
    <section className="mx-auto flex w-full max-w-[1680px] flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex items-start justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
            <CalendarDays className="size-4" />
            Расписание
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-studify-text">
            Календарь экзаменов
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Все важные даты предметов в одном месте.
          </p>
        </div>
      </header>

      <ExamCalendar />
    </section>
  );
}
