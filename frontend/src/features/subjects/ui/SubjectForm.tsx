import { type FormEvent, useState } from "react";
import { type CreateSubjectPayload } from "../../../entities/subject/types.ts";
import { Button } from "../../../shared/ui/Button.tsx";

type SubjectFormProps = {
  isSubmitting?: boolean;
  submitError?: Error | null;
  onSubmit: (subject: CreateSubjectPayload) => Promise<void> | void;
};

const emptyFormState: CreateSubjectPayload = {
  name: "",
  lecturer: "",
  exam_date: "",
};

const controlClassName =
  "h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm text-[var(--color-text)] shadow-sm outline-none transition placeholder:text-[var(--color-text-soft)] focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary-soft)]";

export function SubjectForm({
  isSubmitting = false,
  submitError = null,
  onSubmit,
}: SubjectFormProps) {
  const [form, setForm] = useState<CreateSubjectPayload>(emptyFormState);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.name.trim()) {
      return;
    }

    await onSubmit({
      name: form.name.trim(),
      lecturer: form.lecturer.trim(),
      exam_date: form.exam_date,
    });

    setForm(emptyFormState);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-card)]"
    >
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-primary)]">
          New subject
        </p>
        <h2 className="mt-2 text-xl font-semibold tracking-tight text-[var(--color-text)]">
          Add subject
        </h2>
        <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">
          Create a subject first, then connect study tasks to it.
        </p>
      </div>

      <div className="mt-6 grid gap-5">
        <label
          htmlFor="subject-name"
          className="grid gap-2 text-sm font-medium text-[var(--color-text)]"
        >
          Subject name
          <input
            id="subject-name"
            aria-label="Subject name"
            required
            value={form.name}
            disabled={isSubmitting}
            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            placeholder="Databases"
            className={controlClassName}
          />
        </label>

        <label
          htmlFor="subject-lecturer"
          className="grid gap-2 text-sm font-medium text-[var(--color-text)]"
        >
          Lecturer
          <input
            id="subject-lecturer"
            aria-label="Lecturer"
            value={form.lecturer}
            disabled={isSubmitting}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                lecturer: event.target.value,
              }))
            }
            placeholder="Dr. Smith"
            className={controlClassName}
          />
        </label>

        <label
          htmlFor="subject-exam-date"
          className="grid gap-2 text-sm font-medium text-[var(--color-text)]"
        >
          Exam date
          <input
            id="subject-exam-date"
            aria-label="Exam date"
            type="date"
            value={form.exam_date}
            disabled={isSubmitting}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                exam_date: event.target.value,
              }))
            }
            className={controlClassName}
          />
        </label>
      </div>

      {submitError ? (
        <p className="mt-4 rounded-xl border border-red-200 bg-[var(--color-danger-soft)] px-3 py-2 text-sm text-red-700">
          Failed to create subject: {submitError.message}
        </p>
      ) : null}

      <Button type="submit" disabled={isSubmitting || !form.name.trim()} className="mt-6 w-full">
        {isSubmitting ? "Creating subject..." : "Create subject"}
      </Button>
    </form>
  );
}
