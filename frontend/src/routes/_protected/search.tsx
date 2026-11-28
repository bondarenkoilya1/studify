import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { BookOpen, CheckSquare, ChevronRight, Search } from "lucide-react";
import { STATUS_CONFIG } from "@/entities/task/model/presentation";
import {
  type GetStudySearchParams,
  type StudySearchResult,
  useGetStudySearch,
  useGetUserSubjects,
} from "@/shared/api";
import { formatStudyDate } from "@/shared/lib/study-date";
import { Button } from "@/shared/ui/button";
import { FormField } from "@/shared/ui/form-field";
import { Input } from "@/shared/ui/input";

const pageSize = 25;
const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
const selectClass = "form-control min-h-11 w-full";

export const Route = createFileRoute("/_protected/search")({
  validateSearch: (search: Record<string, unknown>): { subject?: number } => {
    return typeof search.subject === "number" &&
      Number.isSafeInteger(search.subject) &&
      search.subject > 0
      ? { subject: search.subject }
      : {};
  },
  component: SearchRoute,
});

function SearchRoute() {
  const { subject } = Route.useSearch();
  return <StudySearch key={subject ?? 0} initialSubject={subject} />;
}

function StudySearch({ initialSubject }: { initialSubject?: number }) {
  const initialKind = initialSubject ? "task" : "";
  const [kind, setKind] = useState<GetStudySearchParams["kind"] | "">(
    initialKind,
  );
  const [filters, setFilters] = useState<GetStudySearchParams>({
    kind: initialKind || undefined,
    subject_id: initialSubject,
    time_zone: timeZone,
  });
  const [subjectFilter, setSubjectFilter] = useState(
    initialSubject ? String(initialSubject) : "",
  );
  const [offset, setOffset] = useState(0);
  const subjects = useGetUserSubjects();
  const search = useGetStudySearch({ ...filters, offset });

  function apply(form: HTMLFormElement) {
    const data = new FormData(form);
    const subject = Number(data.get("subject"));
    setFilters({
      q: String(data.get("q") ?? "").trim() || undefined,
      kind: kind || undefined,
      subject_id: subject > 0 ? subject : undefined,
      status:
        kind !== "subject"
          ? ((data.get("status") ||
              undefined) as GetStudySearchParams["status"])
          : undefined,
      due:
        kind !== "subject"
          ? ((data.get("due") || undefined) as GetStudySearchParams["due"])
          : undefined,
      sort: data.get("sort") as GetStudySearchParams["sort"],
      time_zone: timeZone,
    });
    setOffset(0);
  }

  return (
    <section className="mx-auto w-full max-w-4xl space-y-5 px-4 py-6 sm:px-6 sm:py-8">
      <h1 className="text-3xl font-semibold tracking-tight">Поиск</h1>
      <form
        className="space-y-4 rounded-2xl border bg-card p-4 sm:p-5"
        onSubmit={(event) => {
          event.preventDefault();
          apply(event.currentTarget);
        }}
      >
        <FormField htmlFor="study-search-text" label="Название или описание">
          <Input
            id="study-search-text"
            name="q"
            type="search"
            maxLength={100}
            controlSize="large"
            placeholder="Например, лабораторная"
          />
        </FormField>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <FormField htmlFor="study-search-kind" label="Искать в">
            <select
              id="study-search-kind"
              className={selectClass}
              value={kind}
              onChange={(event) => setKind(event.target.value as typeof kind)}
            >
              <option value="">Предметы и задачи</option>
              <option value="task">Задачи</option>
              <option value="subject">Предметы</option>
            </select>
          </FormField>
          <FormField htmlFor="study-search-subject" label="Предмет">
            <select
              id="study-search-subject"
              name="subject"
              className={selectClass}
              value={subjectFilter}
              onChange={(event) => setSubjectFilter(event.target.value)}
              disabled={subjects.isPending}
            >
              <option value="">Все предметы</option>
              {subjectFilter &&
                !subjects.data?.some(
                  ({ id }) => String(id) === subjectFilter,
                ) && <option value={subjectFilter}>Выбранный предмет</option>}
              {subjects.data?.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
                </option>
              ))}
            </select>
          </FormField>
          <FormField htmlFor="study-search-sort" label="Сортировка">
            <select
              id="study-search-sort"
              name="sort"
              className={selectClass}
              defaultValue="recent"
            >
              <option value="recent">Сначала новые</option>
              <option value="due">По сроку сдачи</option>
              <option value="name">По названию</option>
              <option value="subject">По предмету</option>
              <option value="status">По статусу задачи</option>
            </select>
          </FormField>
          {kind !== "subject" && (
            <>
              <FormField htmlFor="study-search-status" label="Статус задачи">
                <select
                  id="study-search-status"
                  name="status"
                  className={selectClass}
                >
                  <option value="">Все статусы</option>
                  {Object.entries(STATUS_CONFIG).map(([name, status]) => (
                    <option value={name} key={name}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField htmlFor="study-search-date" label="Срок сдачи">
                <select
                  id="study-search-date"
                  name="due"
                  className={selectClass}
                >
                  <option value="">Все сроки</option>
                  <option value="today">Сегодня</option>
                  <option value="week">Ближайшие семь дней</option>
                  <option value="overdue">Просрочено</option>
                  <option value="none">Без срока</option>
                </select>
              </FormField>
            </>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button type="submit">
            <Search aria-hidden="true" /> Найти
          </Button>
          <Button
            type="reset"
            variant="ghost"
            onClick={() => {
              setKind(initialKind);
              setSubjectFilter(initialSubject ? String(initialSubject) : "");
              setOffset(0);
              setFilters({
                kind: initialKind || undefined,
                subject_id: initialSubject,
                time_zone: timeZone,
              });
            }}
          >
            Сбросить
          </Button>
        </div>
      </form>

      {search.isPending && (
        <p role="status" className="text-sm text-muted-foreground">
          Ищем…
        </p>
      )}
      {search.isError && (
        <div className="flex flex-wrap items-center gap-2">
          <p role="alert" className="text-sm text-destructive">
            Не удалось выполнить поиск.
          </p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => void search.refetch()}
          >
            Повторить
          </Button>
        </div>
      )}
      {search.data && (
        <section
          aria-label="Результаты поиска"
          aria-busy={search.isFetching}
          className="space-y-3"
        >
          {search.data.items.length > 0 ? (
            <ul className="divide-y rounded-2xl border bg-card px-4">
              {search.data.items.map((item) => (
                <ResultRow key={`${item.kind}-${item.id}`} item={item} />
              ))}
            </ul>
          ) : (
            <p
              role="status"
              className="rounded-2xl border border-dashed p-5 text-sm text-muted-foreground"
            >
              Ничего не найдено. Измените запрос или фильтры.
            </p>
          )}
          {(offset > 0 || search.data.has_more) && (
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={offset === 0 || search.isFetching}
                onClick={() => setOffset(offset - pageSize)}
              >
                Назад
              </Button>
              <span className="text-muted-foreground">
                Страница {offset / pageSize + 1}
              </span>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={!search.data.has_more || search.isFetching}
                onClick={() => setOffset(offset + pageSize)}
              >
                Дальше
              </Button>
            </div>
          )}
        </section>
      )}
    </section>
  );
}

function ResultRow({ item }: { item: StudySearchResult }) {
  const isTask = item.kind === "task";
  const Icon = isTask ? CheckSquare : BookOpen;
  const date = item.deadline_date ?? item.deadline ?? item.exam_date;
  const dateLabel = date
    ? formatStudyDate(
        date,
        item.deadline && !item.deadline_date
          ? "d MMM yyyy, HH:mm"
          : "d MMM yyyy",
      )
    : undefined;
  return (
    <li>
      <Link
        to="/subjects/$id"
        params={{ id: item.subject_id }}
        search={{ task: isTask ? item.id : undefined }}
        className="flex min-h-14 items-center gap-3 rounded-lg py-3 hover:bg-muted/50 focus-visible:outline-2 focus-visible:outline-ring"
      >
        <Icon
          className="size-4 shrink-0 text-muted-foreground"
          aria-hidden="true"
        />
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold wrap-anywhere">
            {item.name}
          </span>
          <span className="mt-0.5 flex flex-wrap gap-x-2 text-xs text-muted-foreground">
            <span className="wrap-anywhere">
              {isTask ? item.subject_name : "Предмет"}
            </span>
            {item.status && <span>{STATUS_CONFIG[item.status].label}</span>}
            {dateLabel && (
              <span>
                {isTask ? "Сдать " : "Событие "}
                <time dateTime={date ?? ""}>{dateLabel}</time>
              </span>
            )}
          </span>
        </span>
        <ChevronRight
          className="size-4 shrink-0 text-muted-foreground"
          aria-hidden="true"
        />
      </Link>
    </li>
  );
}
