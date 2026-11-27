import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/lib/cn";
import type { AgendaView, CalendarView } from "../model/calendar-events";

export function ExamCalendarToolbar({
  title,
  view,
  agendaView,
  onViewChange,
  onPrev,
  onNext,
  onToday,
}: {
  title: string;
  view: CalendarView;
  agendaView: AgendaView;
  onViewChange: (view: CalendarView) => void;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
}) {
  const views = [
    { value: "dayGridMonth", label: "Месяц" },
    { value: "timeGridWeek", label: "Неделя" },
    { value: agendaView, label: "Список" },
  ] as const;

  return (
    <div className="flex flex-col gap-4 px-3 py-4 sm:px-5 sm:py-5 lg:flex-row lg:items-center lg:justify-between lg:px-7">
      <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
        <h2 className="min-w-0 basis-full text-xl font-semibold tracking-[-0.03em] wrap-anywhere text-studify-text sm:basis-auto sm:text-[22px]">
          {title}
        </h2>

        <div className="flex items-center">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-10"
            aria-label="Предыдущий период"
            onClick={onPrev}
          >
            <ChevronLeft />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-10"
            aria-label="Следующий период"
            onClick={onNext}
          >
            <ChevronRight />
          </Button>
        </div>

        <Button
          type="button"
          variant="outline"
          className="min-h-10"
          onClick={onToday}
        >
          Сегодня
        </Button>
      </div>

      <div className="grid grid-cols-3 rounded-full border border-black/[0.055] bg-neutral-100/80 p-1">
        {views.map((item) => (
          <button
            key={item.value}
            type="button"
            aria-pressed={view === item.value}
            onClick={() => onViewChange(item.value)}
            className={cn(
              "min-h-9 rounded-full px-1.5 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-studify-active sm:px-3.5",
              view === item.value
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}
