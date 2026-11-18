import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/lib/cn";
import type { CalendarView } from "../model/calendar-events";

const views: Array<{ value: CalendarView; label: string }> = [
  { value: "dayGridMonth", label: "Месяц" },
  { value: "timeGridWeek", label: "Неделя" },
  { value: "listMonth", label: "Список" },
];

export function ExamCalendarToolbar({
  title,
  view,
  onViewChange,
  onPrev,
  onNext,
  onToday,
}: {
  title: string;
  view: CalendarView;
  onViewChange: (view: CalendarView) => void;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
}) {
  return (
    <div className="flex flex-col gap-4 px-5 py-5 lg:flex-row lg:items-center lg:justify-between lg:px-7">
      <div className="flex items-center gap-3">
        <h2 className="min-w-44 text-[22px] font-semibold tracking-[-0.03em] text-studify-text">
          {title}
        </h2>

        <div className="flex items-center">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Предыдущий период"
            onClick={onPrev}
          >
            <ChevronLeft />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Следующий период"
            onClick={onNext}
          >
            <ChevronRight />
          </Button>
        </div>

        <Button type="button" variant="outline" size="sm" onClick={onToday}>
          Сегодня
        </Button>
      </div>

      <div className="grid grid-cols-3 rounded-full border border-black/[0.055] bg-neutral-100/80 p-1">
        {views.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => onViewChange(item.value)}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors",
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
