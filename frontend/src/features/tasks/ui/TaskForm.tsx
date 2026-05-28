import { type FormEvent, useState } from "react";
import { type CreateTaskPayload, type TaskStatus } from "../../../entities/task/types.ts";
import { type Subject } from "../../../entities/subject/types.ts";
import { Button } from "../../../shared/ui/Button.tsx";

type TaskFormState = {
  name: string;
  subject_id: number;
  deadline: string;
  status: TaskStatus;
};

type TaskFormProps = {
  subjects: Subject[];
  isSubjectsLoading?: boolean;
  subjectsError?: Error | null;
  isSubmitting?: boolean;
  submitError?: Error | null;
  onSubmit: (task: CreateTaskPayload) => Promise<void> | void;
};

const emptyFormState: TaskFormState = {
  name: "",
  subject_id: 0,
  deadline: "",
  status: "not_completed",
};

const controlClassName =
  "h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm text-[var(--color-text)] shadow-sm outline-none transition placeholder:text-[var(--color-text-soft)] focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary-soft)]";

export function TaskForm({
  subjects,
  isSubjectsLoading = false,
  subjectsError = null,
  isSubmitting = false,
  submitError = null,
  onSubmit,
}: TaskFormProps) {
  const [form, setForm] = useState<TaskFormState>(emptyFormState);
  const selectedSubjectId = form.subject_id || subjects[0]?.id || 0;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.name.trim() || !selectedSubjectId || !form.status) {
      return;
    }

    await onSubmit({
      name: form.name.trim(),
      subject_id: selectedSubjectId,
      deadline: form.deadline,
      status: form.status,
    });

    setForm({
      ...emptyFormState,
      subject_id: selectedSubjectId,
    });
  }

  const hasSubjects = subjects.length > 0;
  const subjectSelectValue = selectedSubjectId || "";
  const isDisabled = isSubmitting || isSubjectsLoading || !hasSubjects;

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-card)]"
    >
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-primary)]">
          New task
        </p>
        <h2 className="mt-2 text-xl font-semibold tracking-tight text-[var(--color-text)]">
          Add study task
        </h2>
        <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">
          Keep task details structured for the API shape you will connect later.
        </p>
      </div>

      <div className="mt-6 grid gap-5">
        <label
          htmlFor="task-name"
          className="grid gap-2 text-sm font-medium text-[var(--color-text)]"
        >
          Task name
          <input
            id="task-name"
            aria-label="Task name"
            required
            value={form.name}
            disabled={isSubmitting}
            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            placeholder="Read chapter 4"
            className={controlClassName}
          />
        </label>

        <label
          htmlFor="task-subject"
          className="grid gap-2 text-sm font-medium text-[var(--color-text)]"
        >
          Subject
          <select
            id="task-subject"
            aria-label="Subject"
            required
            value={subjectSelectValue}
            disabled={isDisabled}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                subject_id: Number(event.target.value),
              }))
            }
            className={controlClassName}
          >
            {isSubjectsLoading ? <option value="">Loading subjects...</option> : null}
            {!isSubjectsLoading && !hasSubjects ? (
              <option value="">No subjects available</option>
            ) : null}
            {subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.name}
              </option>
            ))}
          </select>
        </label>

        <label
          htmlFor="task-deadline"
          className="grid gap-2 text-sm font-medium text-[var(--color-text)]"
        >
          Deadline
          <input
            id="task-deadline"
            aria-label="Deadline"
            required
            type="date"
            value={form.deadline}
            disabled={isSubmitting}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                deadline: event.target.value,
              }))
            }
            className={controlClassName}
          />
        </label>

        <label
          htmlFor="task-status"
          className="grid gap-2 text-sm font-medium text-[var(--color-text)]"
        >
          Status
          <select
            id="task-status"
            aria-label="Status"
            required
            value={form.status}
            disabled={isSubmitting}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                status: event.target.value as TaskStatus,
              }))
            }
            className={controlClassName}
          >
            <option value="not_completed">not_completed</option>
            <option value="ongoing">ongoing</option>
            <option value="completed">completed</option>
          </select>
        </label>
      </div>

      {subjectsError ? (
        <p className="mt-4 rounded-xl border border-red-200 bg-[var(--color-danger-soft)] px-3 py-2 text-sm text-red-700">
          Failed to load subjects: {subjectsError.message}
        </p>
      ) : null}

      {submitError ? (
        <p className="mt-4 rounded-xl border border-red-200 bg-[var(--color-danger-soft)] px-3 py-2 text-sm text-red-700">
          Failed to create task: {submitError.message}
        </p>
      ) : null}

      <Button
        type="submit"
        disabled={isDisabled || !form.name.trim() || !form.deadline}
        className="mt-6 w-full"
      >
        {isSubmitting ? "Creating task..." : "Create task"}
      </Button>
    </form>
  );
}
