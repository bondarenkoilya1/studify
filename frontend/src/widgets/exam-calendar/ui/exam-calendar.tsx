import { useMemo, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import FullCalendar, {
  type CalendarRef,
  type DatesSetInfo,
  type EventClickInfo,
  type EventInput,
} from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/react/daygrid";
import timeGridPlugin from "@fullcalendar/react/timegrid";
import listPlugin from "@fullcalendar/react/list";
import ruLocale from "@fullcalendar/react/locales/ru";
import "@fullcalendar/react/skeleton.css";
import { useGetUserSubjects, useGetUserTasks } from "@/shared/api";
import { RequestError } from "@/shared/ui/page-state";
import {
  subjectToCalendarEvents,
  taskToCalendarEvents,
  type CalendarView,
} from "../model/calendar-events";
import { ExamCalendarToolbar } from "./exam-calendar-toolbar";
import { ExamCalendarEvent } from "./exam-calendar-event";

export function ExamCalendar() {
  const navigate = useNavigate();
  const calendarRef = useRef<CalendarRef>(null);
  const [view, setView] = useState<CalendarView>("dayGridMonth");
  const [title, setTitle] = useState("");
  const subjectsQuery = useGetUserSubjects();
  const tasksQuery = useGetUserTasks();
  const { data: subjects } = subjectsQuery;
  const { data: tasks } = tasksQuery;

  const events = useMemo<EventInput[]>(() => {
    const calendarSubjects = subjects ?? [];

    return [
      ...subjectToCalendarEvents(calendarSubjects),
      ...taskToCalendarEvents(tasks ?? [], calendarSubjects),
    ];
  }, [subjects, tasks]);

  const loadError =
    (subjects === undefined ? subjectsQuery.error : null) ??
    (tasks === undefined ? tasksQuery.error : null);

  if (loadError) {
    return (
      <RequestError
        error={loadError}
        onRetry={() => {
          if (subjects === undefined) void subjectsQuery.refetch();
          if (tasks === undefined) void tasksQuery.refetch();
        }}
      />
    );
  }

  if (subjectsQuery.isPending || tasksQuery.isPending) {
    return <ExamCalendarSkeleton />;
  }

  const changeView = (nextView: CalendarView) => {
    setView(nextView);
    calendarRef.current?.getApi().changeView(nextView);
  };

  const handleEventClick = (info: EventClickInfo) => {
    const subjectId = info.event.extendedProps.subjectId as number | undefined;

    if (subjectId && subjectId > 0) {
      navigate({
        to: "/subjects/$id",
        params: { id: subjectId },
      });
    }
  };

  const handleDatesSet = (info: DatesSetInfo) => {
    setTitle(info.view.title);
  };

  return (
    <div className="exam-calendar overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
      <ExamCalendarToolbar
        title={title}
        view={view}
        onViewChange={changeView}
        onPrev={() => calendarRef.current?.getApi().prev()}
        onNext={() => calendarRef.current?.getApi().next()}
        onToday={() => calendarRef.current?.getApi().today()}
      />

      <div className="p-3 sm:p-5">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, listPlugin]}
          locales={[ruLocale]}
          locale="ru"
          initialView={view}
          events={events}
          headerToolbar={false}
          height="auto"
          fixedWeekCount={false}
          showNonCurrentDates
          firstDay={1}
          nowIndicator
          eventDisplay="block"
          dayMaxEvents={3}
          moreLinkText={(count) => `ещё ${count}`}
          eventClick={handleEventClick}
          datesSet={handleDatesSet}
          eventContent={(arg) => <ExamCalendarEvent {...arg} />}
          titleFormat={{ year: "numeric", month: "long" }}
          dayCellDidMount={(arg) => {
            if (!arg.isToday) return;
            arg.el
              .querySelector(".fc-daygrid-day-number")
              ?.classList.add("studify-today-number");
          }}
          slotMinTime="06:00:00"
          slotMaxTime="22:00:00"
          scrollTime="08:00:00"
          slotDuration="01:00:00"
          slotHeaderFormat={{
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          }}
          allDaySlot
          allDayText="Весь день"
          dayHeaderContent={(arg) => (
            arg.view.type === "timeGridWeek" ? (
              <div className="flex flex-col items-center justify-center gap-0.5 leading-[1.05]">
                <span className="text-[11px] font-medium text-neutral-400">
                  {new Intl.DateTimeFormat("ru-RU", {
                    weekday: "short",
                  })
                    .format(arg.date)
                    .replace(".", "")}
                </span>
                <span
                  className={
                    arg.isToday
                      ? "flex size-7 items-center justify-center rounded-full bg-red-500 text-[13px] font-semibold text-white"
                      : "text-[13px] font-semibold tabular-nums text-neutral-700"
                  }
                >
                  {arg.date.getDate()}
                </span>
              </div>
            ) : (
              <span className="text-[11px] font-medium text-neutral-400">
                {new Intl.DateTimeFormat("ru-RU", {
                  weekday: "narrow",
                })
                  .format(arg.date)
                  .replace(".", "")}
              </span>
            )
          )}
          listDayFormat={{
            weekday: "long",
            day: "numeric",
            month: "long",
          }}
          weekNumbers={false}
        />
      </div>
    </div>
  );
}

function ExamCalendarSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
      <div className="h-20 border-b border-black/[0.05] px-7 py-5">
        <div className="h-6 w-44 animate-pulse rounded-lg bg-muted" />
      </div>
      <div className="grid h-[680px] grid-cols-7">
        {Array.from({ length: 35 }).map((_, index) => (
          <div
            key={index}
            className="border-b border-r border-black/[0.05] p-3 last:border-r-0"
          >
            <div className="size-5 animate-pulse rounded-md bg-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}
