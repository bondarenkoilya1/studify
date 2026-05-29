import { type FormEvent, useState } from "react";
import { type CreateTaskPayload, type TaskStatus } from "../../../entities/task/types.ts";
import { type Subject } from "../../../entities/subject/types.ts";
import { statusLabels } from "../../../shared/lib/taskStatus.ts";
import { Button } from "../../../shared/ui/Button.tsx";
import { taskSchema } from "../model/schema.ts";

type TaskFormState = {
  name: string;
  subject_id: number;
  deadline: string;
  status: TaskStatus;
};

type TaskFormField = keyof TaskFormState;
type TaskFormErrors = Partial<Record<TaskFormField, string>>;
type TouchedFields = Partial<Record<TaskFormField, boolean>>;

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

const taskStatusOptions: TaskStatus[] = ["not_completed", "ongoing", "completed"];

const controlClassName =
  "h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm text-[var(--color-text)] shadow-sm outline-none transition placeholder:text-[var(--color-text-soft)] focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary-soft)]";

const invalidControlClassName =
  "border-red-300 focus:border-red-500 focus:ring-[var(--color-danger-soft)]";

function validateTaskForm(form: TaskFormState, selectedSubjectId: number): TaskFormErrors {
  const result = taskSchema.safeParse({
    ...form,
    name: form.name.trim(),
    subject_id: selectedSubjectId,
  });

  if (result.success) {
    return {};
  }

  const fieldErrors = result.error.flatten().fieldErrors;

  return {
    name: fieldErrors.name?.[0],
    subject_id: fieldErrors.subject_id?.[0],
    deadline: fieldErrors.deadline?.[0],
    status: fieldErrors.status?.[0],
  };
}

export function TaskForm({
  subjects,
  isSubjectsLoading = false,
  subjectsError = null,
  isSubmitting = false,
  submitError = null,
  onSubmit,
}: TaskFormProps) {
  const [form, setForm] = useState<TaskFormState>(emptyFormState);
  const [touchedFields, setTouchedFields] = useState<TouchedFields>({});
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const selectedSubjectId = form.subject_id || subjects[0]?.id || 0;
  const validationErrors = validateTaskForm(form, selectedSubjectId);

  function getVisibleError(field: TaskFormField) {
    return hasSubmitted || touchedFields[field] ? validationErrors[field] : undefined;
  }

  function markFieldTouched(field: TaskFormField) {
    setTouchedFields((current) => ({ ...current, [field]: true }));
  }

  function getControlClassName(error?: string) {
    return error ? `${controlClassName} ${invalidControlClassName}` : controlClassName;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setHasSubmitted(true);

    if (Object.keys(validationErrors).some((field) => validationErrors[field as TaskFormField])) {
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
    setTouchedFields({});
    setHasSubmitted(false);
  }

  const hasSubjects = subjects.length > 0;
  const subjectSelectValue = selectedSubjectId || "";
  const isDisabled = isSubmitting || isSubjectsLoading || !hasSubjects;
  const nameError = getVisibleError("name");
  const subjectError =
    getVisibleError("subject_id") ||
    (!isSubjectsLoading && !hasSubjects ? "Create a subject before adding tasks." : undefined);
  const deadlineError = getVisibleError("deadline");
  const statusError = getVisibleError("status");

  return (
    <form
      noValidate
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
            aria-invalid={Boolean(nameError)}
            aria-describedby={nameError ? "task-name-error" : undefined}
            required
            value={form.name}
            disabled={isSubmitting}
            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            onBlur={() => markFieldTouched("name")}
            placeholder="Read chapter 4"
            className={getControlClassName(nameError)}
          />
          {nameError ? (
            <span id="task-name-error" className="text-xs font-medium text-red-700">
              {nameError}
            </span>
          ) : null}
        </label>

        <label
          htmlFor="task-subject"
          className="grid gap-2 text-sm font-medium text-[var(--color-text)]"
        >
          Subject
          <select
            id="task-subject"
            aria-label="Subject"
            aria-invalid={Boolean(subjectError)}
            aria-describedby={subjectError ? "task-subject-error" : undefined}
            required
            value={subjectSelectValue}
            disabled={isDisabled}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                subject_id: Number(event.target.value),
              }))
            }
            onBlur={() => markFieldTouched("subject_id")}
            className={getControlClassName(subjectError)}
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
          {subjectError ? (
            <span id="task-subject-error" className="text-xs font-medium text-red-700">
              {subjectError}
            </span>
          ) : null}
        </label>

        <label
          htmlFor="task-deadline"
          className="grid gap-2 text-sm font-medium text-[var(--color-text)]"
        >
          Deadline
          <input
            id="task-deadline"
            aria-label="Deadline"
            aria-invalid={Boolean(deadlineError)}
            aria-describedby={deadlineError ? "task-deadline-error" : undefined}
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
            onBlur={() => markFieldTouched("deadline")}
            className={getControlClassName(deadlineError)}
          />
          {deadlineError ? (
            <span id="task-deadline-error" className="text-xs font-medium text-red-700">
              {deadlineError}
            </span>
          ) : null}
        </label>

        <label
          htmlFor="task-status"
          className="grid gap-2 text-sm font-medium text-[var(--color-text)]"
        >
          Status
          <select
            id="task-status"
            aria-label="Status"
            aria-invalid={Boolean(statusError)}
            aria-describedby={statusError ? "task-status-error" : undefined}
            required
            value={form.status}
            disabled={isSubmitting}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                status: event.target.value as TaskStatus,
              }))
            }
            onBlur={() => markFieldTouched("status")}
            className={getControlClassName(statusError)}
          >
            {taskStatusOptions.map((status) => (
              <option key={status} value={status}>
                {statusLabels[status]}
              </option>
            ))}
          </select>
          {statusError ? (
            <span id="task-status-error" className="text-xs font-medium text-red-700">
              {statusError}
            </span>
          ) : null}
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

      <Button type="submit" disabled={isDisabled} className="mt-6 w-full">
        {isSubmitting ? "Creating task..." : "Create task"}
      </Button>
    </form>
  );
}
