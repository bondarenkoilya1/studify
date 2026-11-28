import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";
import type { StudyPlanTask } from "@/shared/api";
import { formatStudyDate } from "@/shared/lib/study-date";

function TaskDates({ task }: { task: StudyPlanTask }) {
  const plan = task.scheduled_date ?? task.scheduled_at;
  const due = task.deadline_date ?? task.deadline;

  return (
    <span className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
      {plan && (
        <span>
          План:{" "}
          <time dateTime={plan}>
            {formatStudyDate(
              plan,
              task.scheduled_date ? "d MMM yyyy" : "d MMM yyyy, HH:mm",
            )}
          </time>
        </span>
      )}
      {due && (
        <span>
          Сдать:{" "}
          <time dateTime={due}>
            {formatStudyDate(
              due,
              task.deadline_date ? "d MMM yyyy" : "d MMM yyyy, HH:mm",
            )}
          </time>
        </span>
      )}
      {!plan && !due && <span>Без даты</span>}
    </span>
  );
}

export function PlanSection({
  id,
  title,
  tasks,
  subjectNames,
  empty,
  children,
}: {
  id: string;
  title: string;
  tasks: StudyPlanTask[];
  subjectNames: Map<number, string>;
  empty?: string;
  children?: ReactNode;
}) {
  return (
    <section
      aria-labelledby={id}
      className="rounded-2xl border bg-card text-card-foreground"
    >
      <h2
        id={id}
        className={`px-4 pt-4 pb-2 text-base font-semibold sm:px-5 ${id === "plan-overdue" && tasks.length ? "text-destructive" : ""}`}
      >
        {title}
      </h2>
      {tasks.length ? (
        <ul className="divide-y px-4 pb-2 sm:px-5">
          {tasks.map((task) => (
            <li key={task.id}>
              <Link
                to="/subjects/$id"
                params={{ id: task.subject_id }}
                search={{ task: task.id }}
                className="flex min-h-11 items-center justify-between gap-3 rounded-lg py-3 hover:bg-muted/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-studify-active"
              >
                <span className="min-w-0 flex-1 space-y-1">
                  <span className="block text-sm font-semibold wrap-anywhere">
                    {task.name}
                  </span>
                  <span className="block text-xs wrap-anywhere text-muted-foreground">
                    {subjectNames.get(task.subject_id) ?? "Предмет"}
                  </span>
                  <TaskDates task={task} />
                </span>
                <ChevronRight
                  aria-hidden="true"
                  className="size-4 shrink-0 text-muted-foreground"
                />
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="px-4 pb-4 text-sm text-muted-foreground sm:px-5">
          {empty}
        </p>
      )}
      {children}
    </section>
  );
}
