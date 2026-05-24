import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createSubject, getSubjects } from "../../features/subjects/api/subjects-api.ts";
import { SubjectForm } from "../../features/subjects/ui/SubjectForm.tsx";
import { getTasks } from "../../features/tasks/api/tasks-api.ts";
import { type CreateSubjectPayload } from "../../entities/subject/types.ts";
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
  const nextDeadlineTask = tasks.find((task) => task.due_date);
  const subjectStats = [
    {
      label: "Subjects",
      value: subjectsQuery.isLoading ? "..." : String(subjects.length),
      detail: "Loaded from backend",
    },
    {
      label: "Open tasks",
      value: tasksQuery.isLoading ? "..." : String(openTasks.length),
      detail: "Across all subjects",
    },
    {
      label: "Next deadline",
      value: nextDeadlineTask?.due_date ?? "-",
      detail: nextDeadlineTask?.name ?? "No dated tasks yet",
    },
  ];

  async function handleCreateSubject(subject: CreateSubjectPayload) {
    await createSubjectMutation.mutateAsync(subject);
  }

  return (
    <AppLayout>
      <section className="grid gap-8">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">Subjects</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">
            Organize work by subject
          </h1>
          <p className="mt-4 text-lg leading-8 text-slate-600">
            Subjects are the structure behind every task, deadline, and future study analytics view.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {subjectStats.map((stat) => (
            <StatCard key={stat.label} {...stat} />
          ))}
        </div>

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
          <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <SectionHeader
              eyebrow="Subject overview"
              title="Current subjects"
              description="Subjects loaded from the backend and matched to task counts on the frontend."
            />

            {subjectsQuery.isLoading ? (
              <p className="mt-6 text-sm text-slate-600">Loading subjects...</p>
            ) : null}

            {subjectsQuery.error ? (
              <p className="mt-6 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                Failed to load subjects: {subjectsQuery.error.message}
              </p>
            ) : null}

            {!subjectsQuery.isLoading && !subjectsQuery.error && subjects.length === 0 ? (
              <p className="mt-6 text-sm text-slate-600">
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
                    const nextTask = subjectTasks.find((task) => task.due_date);

                    return (
                      <article
                        key={subject.id}
                        className="rounded-lg border border-slate-200 bg-slate-50/60 p-5"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h3 className="text-base font-semibold text-slate-950">
                              {subject.name}
                            </h3>
                            <p className="mt-1 text-sm font-medium text-slate-500">
                              {subject.lecturer || "No lecturer set"}
                            </p>
                          </div>
                          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                            ID {subject.id}
                          </span>
                        </div>

                        <dl className="mt-6 grid gap-3 text-sm">
                          <div className="flex items-center justify-between">
                            <dt className="text-slate-500">Total tasks</dt>
                            <dd className="font-semibold text-slate-950">{subjectTasks.length}</dd>
                          </div>
                          <div className="flex items-center justify-between">
                            <dt className="text-slate-500">Open tasks</dt>
                            <dd className="font-semibold text-slate-950">
                              {subjectOpenTasks.length}
                            </dd>
                          </div>
                          <div className="flex items-center justify-between">
                            <dt className="text-slate-500">Next deadline</dt>
                            <dd className="font-semibold text-slate-950">
                              {nextTask?.due_date ?? subject.exam_date ?? "-"}
                            </dd>
                          </div>
                        </dl>
                      </article>
                    );
                  })
                : null}
            </div>
          </section>

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
