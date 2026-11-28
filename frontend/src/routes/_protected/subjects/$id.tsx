import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  CalendarDays,
  FileText,
  File as FileIcon,
  Search,
  ArrowLeft,
  Pencil,
} from "lucide-react";

import { TaskList } from "@/widgets/task-list";
import {
  getTaskCountLabel,
  TYPE_LABELS,
} from "@/entities/task/model/presentation";
import {
  filterTasksByType,
  type TaskTypeFilter,
} from "@/entities/task/model/filters";
import { getTaskTypeCounts } from "@/entities/task/model/task-type-counts";
import { UploadSubjectFile } from "@/features/subject/upload-file/upload-subject-file";
import { CreateSubjectDialog } from "@/features/subject/create-subject/ui/create-subject-dialog";
import { CreateTaskButton } from "@/features/task/create-task";
import { UpdateSubjectEventDialog } from "@/features/subject/update-subject";
import { StudyReminderButton } from "@/features/reminders/study-reminder-button";
import { Button } from "@/shared/ui/button";
import {
  ApiError,
  getGetSubjectQueryOptions,
  getGetSubjectTasksQueryOptions,
  type SubjectFile,
  useGetSubjectSuspense,
  useGetSubjectTasksSuspense,
} from "@/shared/api";
import { EXAM_TYPE_LABELS } from "@/entities/subject";
import { formatStudyDate } from "@/shared/lib/study-date";
import { formatBytes, toAbsoluteUrl } from "@/shared/utils";

export const Route = createFileRoute("/_protected/subjects/$id")({
  params: {
    parse: (params) => {
      const id = Number(params.id);

      if (!Number.isInteger(id) || id <= 0) {
        throw notFound();
      }

      return { id };
    },
    stringify: ({ id }) => ({ id: String(id) }),
  },
  validateSearch: (
    search: Record<string, unknown>,
  ): { task?: number; event?: boolean } => {
    const task = search.task;
    if (typeof task === "number" && Number.isSafeInteger(task) && task > 0)
      return { task };
    return search.event === true ? { event: true } : {};
  },
  loader: async ({ context: { queryClient }, params: { id } }) => {
    try {
      await Promise.all([
        queryClient.ensureQueryData(getGetSubjectQueryOptions(id)),
        queryClient.ensureQueryData(getGetSubjectTasksQueryOptions(id)),
      ]);
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        throw notFound();
      }

      throw error;
    }
  },
  component: SubjectPage,
});

function SubjectFilesSidebar({
  files,
  subjectId,
}: {
  files: SubjectFile[];
  subjectId: number;
}) {
  return (
    <aside className="w-full shrink-0 lg:w-72">
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <h2 className="text-base font-semibold tracking-tight text-foreground">
          Материалы курса
        </h2>
        <UploadSubjectFile subjectId={subjectId} />
        {files.length === 0 && (
          <p className="mt-3 text-sm text-muted-foreground">
            Файлов пока нет. Можно добавить PDF или TXT.
          </p>
        )}

        <div className="mt-4 flex flex-col gap-2">
          {files.map((file) => {
            const formattedSize = formatBytes(file.size_bytes);
            const url = toAbsoluteUrl(file.url);

            const isText =
              file.content_type.startsWith("text/plain") ||
              file.name.toLowerCase().endsWith(".txt");

            const iconWrapperClass = isText
              ? "bg-blue-50 text-blue-500 group-hover:bg-blue-100"
              : "bg-red-50 text-red-500 group-hover:bg-red-100";

            const label = isText ? "TXT" : "PDF";
            const IconComponent = isText ? FileText : FileIcon;

            return (
              <a
                key={file.url}
                href={url}
                target="_blank"
                rel="noreferrer"
                className="group flex cursor-pointer items-center gap-3 rounded-2xl border border-transparent p-3 transition-all duration-200 hover:border-border hover:bg-muted"
              >
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-colors ${iconWrapperClass}`}
                >
                  <IconComponent strokeWidth={1.5} size={22} />
                </div>

                <div className="flex min-w-0 flex-1 flex-col justify-center">
                  <p className="truncate text-sm font-medium leading-tight text-foreground">
                    {file.name}
                  </p>

                  <div className="mt-1 flex items-center gap-1.5">
                    <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {label}
                    </span>

                    <span className="text-[12px] text-muted-foreground">
                      {formattedSize}
                    </span>
                  </div>
                </div>

                <div className="text-muted-foreground/60 opacity-0 transition-all duration-200 group-hover:text-muted-foreground group-hover:opacity-100">
                  <Search size={18} strokeWidth={2} />
                </div>
              </a>
            );
          })}
        </div>
      </div>
    </aside>
  );
}

function SubjectPage() {
  const { id } = Route.useParams();
  const { task: focusedTaskId, event: focusedEvent } = Route.useSearch();
  const navigate = Route.useNavigate();

  const { data: subject } = useGetSubjectSuspense(id);
  const { data: tasks } = useGetSubjectTasksSuspense(id);

  const [selectedType, setSelectedType] = useState<TaskTypeFilter>("all");
  const [eventDialogOpen, setEventDialogOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState(false);
  const eventRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (focusedEvent) eventRef.current?.focus();
  }, [focusedEvent]);

  const types = getTaskTypeCounts(tasks);
  const activeType = focusedTaskId === undefined ? selectedType : "all";
  const filteredTasksByType = filterTasksByType(tasks, activeType);
  const missingTask =
    focusedTaskId !== undefined &&
    !tasks.some((task) => task.id === focusedTaskId);

  function selectType(type: TaskTypeFilter) {
    setSelectedType(type);
    if (focusedTaskId !== undefined)
      void navigate({ search: {}, replace: true });
  }

  return (
    <div className="min-h-screen bg-muted/40">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8 lg:flex-row">
        <div className="min-w-0 flex-1">
          <Link
            to="/subjects"
            className="
              group mb-6 inline-flex items-center gap-1.5
              rounded-full bg-card py-1.5 pl-2.5 pr-3.5
              text-sm font-medium text-muted-foreground
              shadow-xs
              transition-all duration-200
              hover:bg-muted hover:text-foreground
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40
            "
          >
            <ArrowLeft
              size={16}
              strokeWidth={2}
              className="transition-transform duration-200 group-hover:-translate-x-0.5"
            />
            Предметы
          </Link>

          <header>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="min-w-0">
                <h1 className="text-3xl font-semibold tracking-[-0.02em] wrap-anywhere text-foreground">
                  {subject.name}
                </h1>

                <p className="mt-1 text-sm text-muted-foreground">
                  {filteredTasksByType.length}{" "}
                  {getTaskCountLabel(filteredTasksByType.length)}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingSubject(true)}
                >
                  <Pencil />
                  Редактировать
                </Button>
                <CreateTaskButton subjectId={id} />
              </div>
            </div>

            {(subject.type === "university" || subject.exam_date) && (
              <section
                ref={eventRef}
                tabIndex={focusedEvent ? -1 : undefined}
                aria-label="Событие предмета"
                className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-3 focus:outline-2 focus:outline-ring"
              >
                <div className="min-w-0 space-y-0.5">
                  <h2 className="text-sm font-semibold">
                    {EXAM_TYPE_LABELS[subject.exam_type]}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    {subject.exam_date
                      ? formatStudyDate(subject.exam_date, "d MMMM yyyy")
                      : "Дата ещё не назначена"}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="min-h-11"
                    onClick={() => setEventDialogOpen(true)}
                  >
                    <CalendarDays aria-hidden="true" />
                    {subject.exam_date ? "Изменить дату" : "Назначить дату"}
                  </Button>
                  {subject.exam_date && (
                    <StudyReminderButton
                      target="subject"
                      id={id}
                      name={subject.name}
                    />
                  )}
                </div>
              </section>
            )}

            {types.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => selectType("all")}
                  className={`
                    rounded-full px-3.5 py-1.5
                    text-xs font-medium
                    transition-all duration-200
                    ${
                      activeType === "all"
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "bg-card text-muted-foreground shadow-xs hover:bg-muted hover:text-foreground"
                    }
                  `}
                >
                  Все
                </button>

                {types.map(({ type, count }) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => selectType(type)}
                    className={`
                      rounded-full px-3.5 py-1.5
                      text-xs font-medium
                      transition-all duration-200
                      ${
                        activeType === type
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "bg-card text-muted-foreground shadow-xs hover:bg-muted hover:text-foreground"
                      }
                    `}
                  >
                    {TYPE_LABELS[type]}

                    <span className="ml-1.5 opacity-60">{count}</span>
                  </button>
                ))}
              </div>
            )}
          </header>

          <div className="mt-8">
            {missingTask && (
              <p role="status" className="text-sm text-muted-foreground">
                Эта задача больше не доступна в предмете.
              </p>
            )}
            <TaskList
              tasks={filteredTasksByType}
              focusedTaskId={focusedTaskId}
            />
          </div>
        </div>

        <SubjectFilesSidebar files={subject.files ?? []} subjectId={id} />
      </div>

      {editingSubject && (
        <CreateSubjectDialog
          open
          subject={subject}
          onOpenChange={setEditingSubject}
        />
      )}
      {eventDialogOpen && (
        <UpdateSubjectEventDialog
          subject={subject}
          open={eventDialogOpen}
          onOpenChange={setEventDialogOpen}
        />
      )}
    </div>
  );
}
