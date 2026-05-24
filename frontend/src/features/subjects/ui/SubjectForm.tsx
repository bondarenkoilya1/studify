import { type FormEvent, useState } from 'react'
import { type CreateSubjectPayload } from '../../../entities/subject/types.ts'

type SubjectFormProps = {
  isSubmitting?: boolean
  submitError?: Error | null
  onSubmit: (subject: CreateSubjectPayload) => Promise<void> | void
}

const emptyFormState: CreateSubjectPayload = {
  name: '',
  lecturer: '',
  exam_date: '',
}

export function SubjectForm({
  isSubmitting = false,
  submitError = null,
  onSubmit,
}: SubjectFormProps) {
  const [form, setForm] = useState<CreateSubjectPayload>(emptyFormState)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!form.name.trim()) {
      return
    }

    await onSubmit({
      name: form.name.trim(),
      lecturer: form.lecturer.trim(),
      exam_date: form.exam_date,
    })

    setForm(emptyFormState)
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
    >
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
          New subject
        </p>
        <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-950">
          Add subject
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Create a subject first, then connect study tasks to it.
        </p>
      </div>

      <div className="mt-6 grid gap-5">
        <label className="grid gap-2 text-sm font-medium text-slate-700">
          Subject name
          <input
            required
            value={form.name}
            disabled={isSubmitting}
            onChange={(event) =>
              setForm((current) => ({ ...current, name: event.target.value }))
            }
            placeholder="Databases"
            className="h-11 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
          />
        </label>

        <label className="grid gap-2 text-sm font-medium text-slate-700">
          Lecturer
          <input
            value={form.lecturer}
            disabled={isSubmitting}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                lecturer: event.target.value,
              }))
            }
            placeholder="Dr. Smith"
            className="h-11 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
          />
        </label>

        <label className="grid gap-2 text-sm font-medium text-slate-700">
          Exam date
          <input
            type="date"
            value={form.exam_date}
            disabled={isSubmitting}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                exam_date: event.target.value,
              }))
            }
            className="h-11 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 shadow-sm outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
          />
        </label>
      </div>

      {submitError ? (
        <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          Failed to create subject: {submitError.message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting || !form.name.trim()}
        className="mt-6 h-11 w-full rounded-md bg-blue-700 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        {isSubmitting ? 'Creating subject...' : 'Create subject'}
      </button>
    </form>
  )
}
