import { useCreateSubjectForm } from "../model/use-create-subject-form";

export function CreateSubjectSection() {
  const {
    register,
    onSubmit,
    isPending,
    formState: { errors },
  } = useCreateSubjectForm();

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-10">
      <header>
        <h1 className="text-3xl font-bold text-studify-text">Subjects</h1>

        <p className="mt-2 text-sm text-studify-muted">
          Manage your university subjects and exam dates.
        </p>
      </header>

      <section className="rounded-2xl border border-studify-border bg-studify-surface p-6 shadow-sm">
        <h2 className="mb-6 text-xl font-semibold text-studify-text">
          Add subject
        </h2>

        <form onSubmit={onSubmit} className="space-y-5">
          <div className="space-y-2">
            <label
              htmlFor="name"
              className="text-sm font-medium text-studify-text"
            >
              Subject name
            </label>

            <input
              id="name"
              {...register("name")}
              placeholder="Databases"
              className="w-full rounded-lg border border-studify-border bg-studify-field px-3 py-2 outline-none transition focus:border-studify-primary"
            />

            {errors.name && (
              <p className="text-sm text-red-500">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label
              htmlFor="lecturer"
              className="text-sm font-medium text-studify-text"
            >
              Lecturer
            </label>

            <input
              id="lecturer"
              {...register("lecturer")}
              placeholder="Dr. Smith"
              className="w-full rounded-lg border border-studify-border bg-studify-field px-3 py-2 outline-none transition focus:border-studify-primary"
            />

            {errors.lecturer && (
              <p className="text-sm text-red-500">{errors.lecturer.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label
              htmlFor="exam_date"
              className="text-sm font-medium text-studify-text"
            >
              Exam date
            </label>

            <input
              id="exam_date"
              type="datetime-local"
              {...register("exam_date")}
              className="w-full rounded-lg border border-studify-border bg-studify-field px-3 py-2 outline-none transition focus:border-studify-primary"
            />

            {errors.exam_date && (
              <p className="text-sm text-red-500">{errors.exam_date.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="rounded-lg bg-studify-primary px-5 py-2.5 font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending ? "Creating..." : "Add subject"}
          </button>
        </form>
      </section>
    </main>
  );
}
