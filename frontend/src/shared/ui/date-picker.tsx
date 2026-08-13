import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

import { Calendar } from "@/shared/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover";
import { cn } from "@/shared/lib/cn";

type DatePickerProps = {
  value?: Date;
  onChange: (date: Date | undefined) => void;
};

export function DatePicker({ value, onChange }: DatePickerProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <Popover>
      <PopoverTrigger
        className={cn(
          "flex w-full items-center justify-between rounded-xl px-3.5 py-3 text-left text-[15px] font-normal transition-all duration-200 outline-none",
          "bg-neutral-100/80 hover:bg-neutral-100/100 dark:bg-neutral-900/60 dark:hover:bg-neutral-900/80",
          "border border-transparent focus:border-blue-500 focus:ring-[3px] focus:ring-blue-500/10",
          "text-neutral-900 dark:text-neutral-100",
          !value && "text-neutral-400 dark:text-neutral-500",
        )}
      >
        <span className="truncate">
          {value
            ? format(value, "d MMMM yyyy", { locale: ru })
            : "Выберите дату"}
        </span>
        <CalendarIcon className="size-4.5 text-neutral-400 dark:text-neutral-500 shrink-0 ml-2" />
      </PopoverTrigger>

      <PopoverContent
        className={cn(
          "w-auto p-2 rounded-2xl border border-neutral-200/80 bg-white/90 backdrop-blur-xl shadow-2xl shadow-neutral-200/50",
          "dark:border-neutral-800/80 dark:bg-neutral-950/90 dark:shadow-none",
        )}
        align="start"
        sideOffset={6}
      >
        <Calendar
          mode="single"
          selected={value}
          onSelect={onChange}
          locale={ru}
          disabled={{ before: today }}
        />
      </PopoverContent>
    </Popover>
  );
}
