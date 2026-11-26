import { CalendarIcon, X } from "lucide-react";
import { ru } from "date-fns/locale";
import { formatStudyDate } from "@/shared/lib/study-date";

import { Calendar } from "@/shared/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover";
import { cn } from "@/shared/lib/cn";

type DatePickerProps = {
  value?: Date;
  onChange: (date: Date | undefined) => void;
  className?: string;
  disablePast?: boolean;
  clearable?: boolean;
  clearLabel?: string;
  id?: string;
};

export function DatePicker({
  value,
  onChange,
  className,
  disablePast = true,
  clearable = false,
  clearLabel = "Очистить дату",
  id,
}: DatePickerProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const defaultSessionMonth = (() => {
    const now = new Date();

    if (now.getMonth() < 5) {
      return new Date(now.getFullYear(), 5, 1);
    }

    return new Date(now.getFullYear() + 1, 0, 1);
  })();

  return (
    <div className={cn("flex items-center gap-1.5", clearable && "w-full")}>
      <Popover>
        <PopoverTrigger
          id={id}
          className={cn(
            "form-control flex min-h-11 items-center justify-between gap-2 text-left font-normal hover:bg-muted",
            !value && "text-muted-foreground",
            className,
          )}
        >
          <span className="truncate">
            {value ? formatStudyDate(value, "d MMMM yyyy") : "Выберите дату"}
          </span>
          <CalendarIcon className="size-4 shrink-0 text-muted-foreground" />
        </PopoverTrigger>

        <PopoverContent
          className="w-auto rounded-2xl border border-border p-2 shadow-lg"
          align="start"
          sideOffset={6}
        >
          <Calendar
            mode="single"
            selected={value}
            onSelect={onChange}
            locale={ru}
            disabled={disablePast ? { before: today } : undefined}
            defaultMonth={value ?? defaultSessionMonth}
          />
        </PopoverContent>
      </Popover>
      {clearable && value && (
        <button
          type="button"
          aria-label={clearLabel}
          onClick={() => onChange(undefined)}
          className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring"
        >
          <X className="size-4" />
        </button>
      )}
    </div>
  );
}
