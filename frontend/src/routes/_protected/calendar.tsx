import { createFileRoute } from "@tanstack/react-router";
import { ExamCalendar } from "@/widgets/exam-calendar";

export const Route = createFileRoute("/_protected/calendar")({
  component: CalendarPage,
});

function CalendarPage() {
  return (
    <section className="mx-auto flex w-full max-w-[1680px] flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-studify-text">
            Календарь
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Планы работы, сроки сдачи и экзамены.
          </p>
        </div>
      </header>

      <ExamCalendar />
    </section>
  );
}
