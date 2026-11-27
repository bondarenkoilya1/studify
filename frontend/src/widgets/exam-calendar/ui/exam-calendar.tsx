import { addDays } from "date-fns";
import { useMemo, useRef, useState } from "react";
import { useRouter } from "@tanstack/react-router";
import FullCalendar, {
  type CalendarRef,
  type DatesSetInfo,
  type EventClickInfo,
  type EventDisplayInfo,
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
  subjectToCalendarEvents,
  taskToCalendarEvents,
  type CalendarView,
} from "../model/calendar-events";
import { formatStudyDate } from "@/shared/lib/study-date";
import { Card } from "@/shared/ui/card";
import { ExamCalendarToolbar } from "./exam-calendar-toolbar";
import { ExamCalendarEvent } from "./exam-calendar-event";

const plugins = [dayGridPlugin, timeGridPlugin, listPlugin];
const locales = [ruLocale];
const views = {
  listUpcoming: {
    type: "list",
    duration: { days: 7 },
    dateAlignment: "day",
  },
};

function renderEvent(arg: EventDisplayInfo) {
  return <ExamCalendarEvent {...arg} />;
}

export function ExamCalendar() {
  const router = useRouter();
  const calendarRef = useRef<CalendarRef>(null);
  const [isMobile] = useState(
    () => window.matchMedia("(width < 640px)").matches,
  );
  const initialView = isMobile ? "listUpcoming" : "dayGridMonth";
  const [view, setView] = useState<CalendarView>(initialView);
  const [title, setTitle] = useState("");
  const { data: subjects } = useGetUserSubjectsSuspense();
  const { data: tasks } = useGetUserTasksSuspense();

  const events = useMemo<EventInput[]>(
    () =>
      [
        ...subjectToCalendarEvents(subjects),
        ...taskToCalendarEvents(tasks, subjects),
      ].map((event) => ({
        ...event,
        url: router.buildLocation({
          to: "/subjects/$id",
          params: { id: event.extendedProps?.subjectId as number },
          search: { task: event.extendedProps?.taskId as number | undefined },
        }).href,
      })),
    [router, subjects, tasks],
  );

  const changeView = (nextView: CalendarView) => {
    setView(nextView);
    calendarRef.current?.getApi().changeView(nextView);
  };

  const handleEventClick = ({ event, jsEvent }: EventClickInfo) => {
    if (
      jsEvent.button !== 0 ||
      jsEvent.metaKey ||
      jsEvent.ctrlKey ||
      jsEvent.shiftKey ||
      jsEvent.altKey
    ) {
      return;
    }

    jsEvent.preventDefault();
    void router.navigate({
      to: "/subjects/$id",
      params: { id: event.extendedProps.subjectId as number },
      search: { task: event.extendedProps.taskId as number | undefined },
    });
  };

  const handleDatesSet = (info: DatesSetInfo) => {
    setTitle(
      info.view.type === "listUpcoming"
        ? `${formatStudyDate(info.start)} — ${formatStudyDate(addDays(info.end, -1))}`
        : info.view.title,
    );
  };

  return (
    <Card
      className={`exam-calendar overflow-hidden ${view === "listUpcoming" ? "[&_.fc]:min-h-0" : ""}`}
    >
      <ExamCalendarToolbar
        title={title}
        view={view}
        agendaView={isMobile ? "listUpcoming" : "listMonth"}
        onViewChange={changeView}
        onPrev={() => calendarRef.current?.getApi().prev()}
        onNext={() => calendarRef.current?.getApi().next()}
        onToday={() => calendarRef.current?.getApi().today()}
      />

      <div className="p-3 sm:p-5">
        <FullCalendar
          ref={calendarRef}
          plugins={plugins}
          locales={locales}
          views={views}
          locale="ru"
          initialView={initialView}
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
          eventContent={renderEvent}
          noEventsText="В этом периоде событий нет."
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
