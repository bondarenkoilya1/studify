import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({ component: HomePage });

function HomePage() {
  return (
    <main className="grid min-h-screen place-items-center bg-studify-canvas p-6 text-studify-text">
      <section className="w-full max-w-105 rounded-3xl border border-studify-border bg-studify-surface p-8 text-center shadow-lg shadow-studify-shadow/10">
        <h1 className="m-0 text-[32px] font-bold tracking-[-0.03em]">
          Studify
        </h1>
        <p className="mt-2 text-studify-muted">
          Организуйте обучение, задачи и дедлайны в одном месте.
        </p>

        <div className="mt-8 flex flex-col gap-3">
          <Link
            to="/login"
            className="flex h-12 items-center justify-center rounded-xl bg-studify-primary font-semibold text-white no-underline transition-colors duration-200 hover:bg-studify-hover active:bg-studify-active focus:outline-none focus:ring-2 focus:ring-studify-focus"
          >
            Войти
          </Link>

          <Link
            to="/register"
            className="flex h-12 items-center justify-center rounded-xl border border-studify-border bg-studify-surface font-semibold text-studify-primary no-underline transition-colors duration-200 hover:bg-studify-wash active:bg-studify-field focus:outline-none focus:ring-2 focus:ring-studify-focus"
          >
            Зарегистрироваться
          </Link>
        </div>
      </section>
    </main>
  );
}
