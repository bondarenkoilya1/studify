import { type FormEvent, useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createSubject,
  getSubjects,
  replaceSubject,
} from "../../features/subjects/api/subjects-api.ts";
import { SubjectForm } from "../../features/subjects/ui/SubjectForm.tsx";
import { getTasks } from "../../features/tasks/api/tasks-api.ts";
import {
  type CreateSubjectPayload,
  type Subject,
  type UpdateSubjectPayload,
} from "../../entities/subject/types.ts";
import { formatOptionalDate } from "../../shared/lib/dateFormat.ts";
import { Card } from "../../shared/ui/Card.tsx";
import { PageHeader } from "../../shared/ui/PageHeader.tsx";
import { SectionHeader } from "../../shared/ui/SectionHeader.tsx";
import { StatCard } from "../../shared/ui/StatCard.tsx";
import { AppLayout } from "../../widgets/app-layout/AppLayout.tsx";

const subjectFieldClassName =
  "h-10 rounded-xl border border-slate-300 bg-white px-3 text-sm text-[var(--color-text)] shadow-sm outline-none transition placeholder:text-[var(--color-text-soft)] focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary-soft)] disabled:cursor-not-allowed disabled:bg-slate-100";

type SubjectUpdateContext = {
  previousSubjects?: Subject[];
};

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Please try again.";
}

export function SubjectsPage() {
  const queryClient = useQueryClient();
  const subjectSuccessTimeouts = useRef<Record<number, ReturnType<typeof setTimeout>>>({});
  const [subjectDrafts, setSubjectDrafts] = useState<Record<number, UpdateSubjectPayload>>({});
  const [subjectUpdateErrors, setSubjectUpdateErrors] = useState<Record<number, string>>({});
  const [subjectUpdateSuccesses, setSubjectUpdateSuccesses] = useState<Record<number, string>>({});
  const [pendingSubjectId, setPendingSubjectId] = useState<number | null>(null);
  const subjectsQuery = useQuery({
    queryKey: ["subjects"],
    queryFn: getSubjects,
  });
  const tasksQuery = useQuery({
    queryKey: ["tasks"],
    queryFn: getTasks,
  });
  const createSubjectMutation = useMutation({
    mutationFn: createSubject,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["subjects"] }),
  });
  const updateSubjectMutation = useMutation({
    mutationFn: ({ id, subject }: { id: number; subject: CreateSubjectPayload }) =>
      replaceSubject(id, subject),
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: ["subjects"] });

      const previousSubjects = queryClient.getQueryData<Subject[]>(["subjects"]);
      queryClient.setQueryData<Subject[]>(["subjects"], (currentSubjects) =>
        currentSubjects?.map((subject) =>
          subject.id === variables.id ? { ...subject, ...variables.subject } : subject,
        ),
      );

      setSubjectUpdateErrors((current) => {
        const next = { ...current };
        delete next[variables.id];
        return next;
      });
      clearSubjectSuccess(variables.id);

      return { previousSubjects };
    },
    onError: (_error, variables, context: SubjectUpdateContext | undefined) => {
      if (context?.previousSubjects) {
        queryClient.setQueryData(["subjects"], context.previousSubjects);
      }

      setSubjectUpdateErrors((current) => ({
        ...current,
        [variables.id]: `Changes were not saved. ${getErrorMessage(_error)}`,
      }));
    },
    onSuccess: (updatedSubject, variables) => {
      queryClient.setQueryData<Subject[]>(["subjects"], (currentSubjects) =>
        currentSubjects?.map((subject) => (subject.id === variables.id ? updatedSubject : subject)),
      );

      setSubjectDrafts((current) => {
        const next = { ...current };
        delete next[variables.id];
        return next;
      });
      showSubjectSuccess(variables.id, "Changes saved.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["subjects"] });
    },
  });

  const subjects = subjectsQuery.data ?? [];
  const tasks = tasksQuery.data ?? [];
  const openTasks = tasks.filter((task) => task.status !== "completed");
  const nextDeadlineTask = tasks.find((task) => task.deadline);
  const subjectStats = [
    {
      label: "Subjects",
      value: subjectsQuery.isLoading ? "..." : String(subjects.length),
      detail: "Loaded from backend",
      icon: "S",
    },
    {
      label: "Open tasks",
      value: tasksQuery.isLoading ? "..." : String(openTasks.length),
      detail: "Across all subjects",
      icon: "O",
    },
    {
      label: "Next deadline",
      value: formatOptionalDate(nextDeadlineTask?.deadline ?? "", "-"),
      detail: nextDeadlineTask?.name ?? "No dated tasks yet",
      icon: "D",
      iconClassName: "bg-amber-100 text-amber-800",
    },
  ];

  useEffect(() => {
    const timeouts = subjectSuccessTimeouts.current;

    return () => {
      Object.values(timeouts).forEach(clearTimeout);
    };
  }, []);

  function clearSubjectSuccess(id: number) {
    const timeout = subjectSuccessTimeouts.current[id];
    if (timeout) {
      clearTimeout(timeout);
      delete subjectSuccessTimeouts.current[id];
    }

    setSubjectUpdateSuccesses((current) => {
      const next = { ...current };
      delete next[id];
      return next;
    });
  }

  function showSubjectSuccess(id: number, message: string) {
    clearSubjectSuccess(id);
    setSubjectUpdateSuccesses((current) => ({
      ...current,
      [id]: message,
    }));
    subjectSuccessTimeouts.current[id] = setTimeout(() => {
      clearSubjectSuccess(id);
    }, 1800);
  }

  async function handleCreateSubject(subject: CreateSubjectPayload) {
    await createSubjectMutation.mutateAsync(subject);
  }

  function updateSubjectDraft(id: number, field: keyof UpdateSubjectPayload, value: string) {
    setSubjectUpdateErrors((current) => {
      const next = { ...current };
      delete next[id];
      return next;
    });
    clearSubjectSuccess(id);
    setSubjectDrafts((current) => ({
      ...current,
      [id]: {
        ...current[id],
        [field]: value,
      },
    }));
  }

  async function handleUpdateSubject(
    event: FormEvent<HTMLFormElement>,
    id: number,
    currentSubject: CreateSubjectPayload,
  ) {
    event.preventDefault();

    const draft = subjectDrafts[id];
    if (!draft) {
      return;
    }

    setPendingSubjectId(id);
    setSubjectUpdateErrors((current) => {
      const next = { ...current };
      delete next[id];
      return next;
    });
    clearSubjectSuccess(id);

    const nextSubject: CreateSubjectPayload = {
      ...currentSubject,
      ...draft,
    };
    const changedFields = Object.entries(draft).filter(([field, value]) => {
      return value !== currentSubject[field as keyof CreateSubjectPayload];
    });

    if (changedFields.length === 0) {
      setSubjectDrafts((current) => {
        const next = { ...current };
        delete next[id];
        return next;
      });
      setPendingSubjectId(null);
      return;
    }

    try {
      await updateSubjectMutation.mutateAsync({ id, subject: nextSubject });
    } catch {
      // Rollback and card-level messaging are handled by the mutation callbacks.
    } finally {
      setPendingSubjectId(null);
    }
  }

  return (
    <AppLayout>
      <section className="grid gap-8">
        <PageHeader
          label="Subjects"
          title="Organize work by subject"
          description="Subjects are the structure behind every task, deadline, and future study analytics view."
        />

        <div className="grid gap-4 md:grid-cols-3">
          {subjectStats.map((stat) => (
            <StatCard key={stat.label} {...stat} />
          ))}
        </div>

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
          <Card>
            <SectionHeader
              eyebrow="Subject overview"
              title="Current subjects"
              description="Subjects loaded from the backend and matched to task counts on the frontend."
            />

            {subjectsQuery.isLoading ? (
              <p className="mt-6 text-sm text-[var(--color-text-muted)]">Loading subjects...</p>
            ) : null}

            {subjectsQuery.error ? (
              <p className="mt-6 rounded-xl border border-red-200 bg-[var(--color-danger-soft)] px-3 py-2 text-sm text-red-700">
                Failed to load subjects: {subjectsQuery.error.message}
              </p>
            ) : null}

            {!subjectsQuery.isLoading && !subjectsQuery.error && subjects.length === 0 ? (
              <p className="mt-6 text-sm text-[var(--color-text-muted)]">
                No subjects yet. Create your first subject.
              </p>
            ) : null}

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {!subjectsQuery.isLoading && !subjectsQuery.error
                ? subjects.map((subject) => {
                    const subjectTasks = tasks.filter((task) => task.subject_id === subject.id);
                    const subjectOpenTasks = subjectTasks.filter(
                      (task) => task.status !== "completed",
                    );
                    const nextTask = subjectTasks.find((task) => task.deadline);
                    const updateError = subjectUpdateErrors[subject.id];
                    const updateSuccess = subjectUpdateSuccesses[subject.id];
                    const isSavingSubject = pendingSubjectId === subject.id;

                    return (
                      <article
                        key={subject.id}
                        className="rounded-2xl border border-[var(--color-border)] bg-slate-50 p-5 transition hover:bg-white hover:shadow-[var(--shadow-card)]"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h3 className="text-base font-semibold text-[var(--color-text)]">
                              {subject.name}
                            </h3>
                            <p className="mt-1 text-sm font-medium text-[var(--color-text-muted)]">
                              {subject.lecturer || "No lecturer set"}
                            </p>
                          </div>
                          <span className="rounded-full bg-[var(--color-primary-soft)] px-3 py-1 text-xs font-semibold text-[var(--color-primary)]">
                            ID {subject.id}
                          </span>
                        </div>

                        <dl className="mt-6 grid gap-3 text-sm">
                          <div className="flex items-center justify-between">
                            <dt className="text-[var(--color-text-muted)]">Total tasks</dt>
                            <dd className="font-semibold text-[var(--color-text)]">
                              {subjectTasks.length}
                            </dd>
                          </div>
                          <div className="flex items-center justify-between">
                            <dt className="text-[var(--color-text-muted)]">Open tasks</dt>
                            <dd className="font-semibold text-[var(--color-text)]">
                              {subjectOpenTasks.length}
                            </dd>
                          </div>
                          <div className="flex items-center justify-between">
                            <dt className="text-[var(--color-text-muted)]">Next deadline</dt>
                            <dd className="font-semibold text-[var(--color-text)]">
                              {formatOptionalDate(nextTask?.deadline ?? subject.exam_date, "-")}
                            </dd>
                          </div>
                        </dl>

                        <form
                          className="mt-6 grid gap-3 border-t border-[var(--color-border)] pt-4"
                          onSubmit={(event) =>
                            handleUpdateSubject(event, subject.id, {
                              name: subject.name,
                              lecturer: subject.lecturer,
                              exam_date: subject.exam_date,
                            })
                          }
                        >
                          <label
                            htmlFor={`subject-name-${subject.id}`}
                            className="grid gap-1 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]"
                          >
                            Name
                            <input
                              id={`subject-name-${subject.id}`}
                              aria-label={`Name for ${subject.name}`}
                              value={subjectDrafts[subject.id]?.name ?? subject.name}
                              disabled={isSavingSubject}
                              onChange={(event) =>
                                updateSubjectDraft(subject.id, "name", event.target.value)
                              }
                              className={subjectFieldClassName}
                            />
                          </label>

                          <label
                            htmlFor={`subject-lecturer-${subject.id}`}
                            className="grid gap-1 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]"
                          >
                            Lecturer
                            <input
                              id={`subject-lecturer-${subject.id}`}
                              aria-label={`Lecturer for ${subject.name}`}
                              value={subjectDrafts[subject.id]?.lecturer ?? subject.lecturer}
                              disabled={isSavingSubject}
                              onChange={(event) =>
                                updateSubjectDraft(subject.id, "lecturer", event.target.value)
                              }
                              placeholder="No lecturer set"
                              className={subjectFieldClassName}
                            />
                          </label>

                          <label
                            htmlFor={`subject-exam-date-${subject.id}`}
                            className="grid gap-1 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]"
                          >
                            Exam date
                            <input
                              id={`subject-exam-date-${subject.id}`}
                              aria-label={`Exam date for ${subject.name}`}
                              type="date"
                              value={subjectDrafts[subject.id]?.exam_date ?? subject.exam_date}
                              disabled={isSavingSubject}
                              onChange={(event) =>
                                updateSubjectDraft(subject.id, "exam_date", event.target.value)
                              }
                              className={subjectFieldClassName}
                            />
                          </label>

                          {updateError ? (
                            <p className="rounded-lg border border-red-200 bg-[var(--color-danger-soft)] px-3 py-2 text-xs font-medium leading-5 text-red-700">
                              {updateError}
                            </p>
                          ) : null}

                          {updateSuccess ? (
                            <p className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs font-medium leading-5 text-green-700">
                              {updateSuccess}
                            </p>
                          ) : null}

                          <button
                            type="submit"
                            disabled={isSavingSubject || !subjectDrafts[subject.id]}
                            className="h-10 rounded-xl bg-[var(--color-primary)] px-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--color-primary-hover)] focus:outline-none focus:ring-4 focus:ring-[var(--color-primary-soft)] disabled:cursor-not-allowed disabled:bg-slate-300"
                          >
                            {isSavingSubject ? "Saving..." : "Save changes"}
                          </button>
                        </form>
                      </article>
                    );
                  })
                : null}
            </div>
          </Card>

          <SubjectForm
            isSubmitting={createSubjectMutation.isPending}
            submitError={createSubjectMutation.error}
            onSubmit={handleCreateSubject}
          />
        </div>
      </section>
    </AppLayout>
  );
}
