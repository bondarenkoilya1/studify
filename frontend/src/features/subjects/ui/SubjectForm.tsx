import { type FormEvent, useState } from "react";
import { type CreateSubjectPayload } from "../../../entities/subject/types.ts";
import { Button } from "../../../shared/ui/Button.tsx";
import { subjectSchema } from "../model/schema.ts";

type SubjectFormProps = {
  isSubmitting?: boolean;
  submitError?: Error | null;
  onSubmit: (subject: CreateSubjectPayload) => Promise<void> | void;
};

type SubjectFormField = keyof CreateSubjectPayload;
type SubjectFormErrors = Partial<Record<SubjectFormField, string>>;
type TouchedFields = Partial<Record<SubjectFormField, boolean>>;

const emptyFormState: CreateSubjectPayload = {
  name: "",
  lecturer: "",
  exam_date: "",
};

const controlClassName =
  "h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm text-[var(--color-text)] shadow-sm outline-none transition placeholder:text-[var(--color-text-soft)] focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary-soft)]";

const invalidControlClassName =
  "border-red-300 focus:border-red-500 focus:ring-[var(--color-danger-soft)]";

function validateSubjectForm(form: CreateSubjectPayload): SubjectFormErrors {
  const result = subjectSchema.safeParse({
    ...form,
    name: form.name.trim(),
  });

  if (result.success) {
    return {};
  }

  const fieldErrors = result.error.flatten().fieldErrors;

  return {
    name: fieldErrors.name?.[0],
    lecturer: fieldErrors.lecturer?.[0],
    exam_date: fieldErrors.exam_date?.[0],
  };
}

export function SubjectForm({
  isSubmitting = false,
  submitError = null,
  onSubmit,
}: SubjectFormProps) {
  const [form, setForm] = useState<CreateSubjectPayload>(emptyFormState);
  const [touchedFields, setTouchedFields] = useState<TouchedFields>({});
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const validationErrors = validateSubjectForm(form);

  function getVisibleError(field: SubjectFormField) {
    return hasSubmitted || touchedFields[field] ? validationErrors[field] : undefined;
  }

  function markFieldTouched(field: SubjectFormField) {
    setTouchedFields((current) => ({ ...current, [field]: true }));
  }

  function getControlClassName(error?: string) {
    return error ? `${controlClassName} ${invalidControlClassName}` : controlClassName;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setHasSubmitted(true);

    if (
      Object.keys(validationErrors).some((field) => validationErrors[field as SubjectFormField])
    ) {
      return;
    }

    await onSubmit({
      name: form.name.trim(),
      lecturer: form.lecturer.trim(),
      exam_date: form.exam_date,
    });

    setForm(emptyFormState);
    setTouchedFields({});
    setHasSubmitted(false);
  }

  const nameError = getVisibleError("name");
  const lecturerError = getVisibleError("lecturer");
  const examDateError = getVisibleError("exam_date");

  return (
    <form
      noValidate
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
            aria-invalid={Boolean(nameError)}
            aria-describedby={nameError ? "subject-name-error" : undefined}
            required
            value={form.name}
            disabled={isSubmitting}
            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            onBlur={() => markFieldTouched("name")}
            placeholder="Databases"
            className={getControlClassName(nameError)}
          />
          {nameError ? (
            <span id="subject-name-error" className="text-xs font-medium text-red-700">
              {nameError}
            </span>
          ) : null}
        </label>

        <label
          htmlFor="subject-lecturer"
          className="grid gap-2 text-sm font-medium text-[var(--color-text)]"
        >
          Lecturer
          <input
            id="subject-lecturer"
            aria-label="Lecturer"
            aria-invalid={Boolean(lecturerError)}
            aria-describedby={lecturerError ? "subject-lecturer-error" : undefined}
            value={form.lecturer}
            disabled={isSubmitting}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                lecturer: event.target.value,
              }))
            }
            onBlur={() => markFieldTouched("lecturer")}
            placeholder="Dr. Smith"
            className={getControlClassName(lecturerError)}
          />
          {lecturerError ? (
            <span id="subject-lecturer-error" className="text-xs font-medium text-red-700">
              {lecturerError}
            </span>
          ) : null}
        </label>

        <label
          htmlFor="subject-exam-date"
          className="grid gap-2 text-sm font-medium text-[var(--color-text)]"
        >
          Exam date
          <input
            id="subject-exam-date"
            aria-label="Exam date"
            aria-invalid={Boolean(examDateError)}
            aria-describedby={examDateError ? "subject-exam-date-error" : undefined}
            type="date"
            value={form.exam_date}
            disabled={isSubmitting}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                exam_date: event.target.value,
              }))
            }
            onBlur={() => markFieldTouched("exam_date")}
            className={getControlClassName(examDateError)}
          />
          {examDateError ? (
            <span id="subject-exam-date-error" className="text-xs font-medium text-red-700">
              {examDateError}
            </span>
          ) : null}
        </label>
      </div>

      {submitError ? (
        <p className="mt-4 rounded-xl border border-red-200 bg-[var(--color-danger-soft)] px-3 py-2 text-sm text-red-700">
          Failed to create subject: {submitError.message}
        </p>
      ) : null}

      <Button type="submit" disabled={isSubmitting} className="mt-6 w-full">
        {isSubmitting ? "Creating subject..." : "Create subject"}
      </Button>
    </form>
  );
}
