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
import {
  useGetUserSubjectsSuspense,
  useGetUserTasksSuspense,
} from "@/shared/api";
import {
  getInitialCalendarMonth,
  subjectToCalendarEvents,
  taskToCalendarEvents,
  type CalendarView,
} from "../model/calendar-events";
import { formatStudyDate } from "@/shared/lib/study-date";
import { Card } from "@/shared/ui/card";
import { ExamCalendarToolbar } from "./exam-calendar-toolbar";
import { ExamCalendarEvent } from "./exam-calendar-event";

export function ExamCalendar() {
  const navigate = useNavigate();
  const calendarRef = useRef<CalendarRef>(null);
  const [view, setView] = useState<CalendarView>("dayGridMonth");
  const [title, setTitle] = useState("");
  const { data: subjects } = useGetUserSubjectsSuspense();
  const { data: tasks } = useGetUserTasksSuspense();

  const events = useMemo<EventInput[]>(
    () => [
      ...subjectToCalendarEvents(subjects),
      ...taskToCalendarEvents(tasks, subjects),
    ],
    [subjects, tasks],
  );

  const [initialDate] = useState(() => getInitialCalendarMonth(events));

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
    <Card className="exam-calendar overflow-hidden">
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
          initialDate={initialDate}
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
          scrollTime="08:00:00"
          slotDuration="01:00:00"
          slotHeaderFormat={{
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          }}
          allDaySlot
          allDayText="Весь день"
          dayHeaderContent={(arg) =>
            arg.view.type === "timeGridWeek" ? (
              <div className="flex flex-col items-center justify-center gap-0.5 leading-[1.05]">
                <span className="text-[11px] font-medium text-muted-foreground">
                  {formatStudyDate(arg.date, "EEEEEE")}
                </span>
                <span
                  className={
                    arg.isToday
                      ? "flex size-7 items-center justify-center rounded-full bg-red-500 text-[13px] font-semibold text-white"
                      : "text-[13px] font-semibold tabular-nums text-foreground"
                  }
                >
                  {arg.date.getDate()}
                </span>
              </div>
            ) : (
              <span className="text-[11px] font-medium text-muted-foreground">
                {formatStudyDate(arg.date, "EEEEE")}
              </span>
            )
          }
          listDayFormat={{
            weekday: "long",
            day: "numeric",
            month: "long",
          }}
          weekNumbers={false}
        />
      </div>
    </Card>
  );
}
