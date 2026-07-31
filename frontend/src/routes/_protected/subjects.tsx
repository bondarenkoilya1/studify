import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_protected/subjects")({
  component: RouteComponent,
});

function RouteComponent() {
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

        <form className="space-y-5">
          <div className="space-y-2">
            <label
              htmlFor="name"
              className="text-sm font-medium text-studify-text"
            >
              Subject name
            </label>

            <input
              id="name"
              type="text"
              placeholder="Databases"
              className="w-full rounded-lg border border-studify-border bg-studify-field px-3 py-2 outline-none transition focus:border-studify-primary"
            />
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
              type="text"
              placeholder="Dr. Smith"
              className="w-full rounded-lg border border-studify-border bg-studify-field px-3 py-2 outline-none transition focus:border-studify-primary"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="examDate"
              className="text-sm font-medium text-studify-text"
            >
              Exam date
            </label>

            <input
              id="examDate"
              type="datetime-local"
              className="w-full rounded-lg border border-studify-border bg-studify-field px-3 py-2 outline-none transition focus:border-studify-primary"
            />
          </div>

          <button
            type="submit"
            className="rounded-lg bg-studify-primary px-5 py-2.5 font-medium text-white transition hover:opacity-90"
          >
            Add subject
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-dashed border-studify-border p-10 text-center">
        <h2 className="text-lg font-semibold text-studify-text">
          No subjects yet
        </h2>

        <p className="mt-2 text-sm text-studify-muted">
          Your subjects will appear here after you create them.
        </p>
      </section>
    </main>
  );
}
