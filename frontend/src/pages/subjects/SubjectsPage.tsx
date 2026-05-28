import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createSubject, getSubjects } from "../../features/subjects/api/subjects-api.ts";
import { SubjectForm } from "../../features/subjects/ui/SubjectForm.tsx";
import { getTasks } from "../../features/tasks/api/tasks-api.ts";
import { type CreateSubjectPayload } from "../../entities/subject/types.ts";
import { Card } from "../../shared/ui/Card.tsx";
import { PageHeader } from "../../shared/ui/PageHeader.tsx";
import { SectionHeader } from "../../shared/ui/SectionHeader.tsx";
import { StatCard } from "../../shared/ui/StatCard.tsx";
import { AppLayout } from "../../widgets/app-layout/AppLayout.tsx";

export function SubjectsPage() {
  const queryClient = useQueryClient();
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
      value: nextDeadlineTask?.deadline ?? "-",
      detail: nextDeadlineTask?.name ?? "No dated tasks yet",
      icon: "D",
      iconClassName: "bg-amber-100 text-amber-800",
    },
  ];

  async function handleCreateSubject(subject: CreateSubjectPayload) {
    await createSubjectMutation.mutateAsync(subject);
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
                              {nextTask?.deadline ?? subject.exam_date ?? "-"}
                            </dd>
                          </div>
                        </dl>
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
