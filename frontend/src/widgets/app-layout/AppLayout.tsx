import { type ReactNode } from "react";
import { Link, NavLink } from "react-router-dom";

type AppLayoutProps = {
  children: ReactNode;
};

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  [
    "rounded-xl px-4 py-2 transition hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text)]",
    isActive
      ? "bg-[var(--color-primary-soft)] text-[var(--color-primary)]"
      : "text-[var(--color-text-muted)]",
  ]
    .filter(Boolean)
    .join(" ");

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <header className="sticky top-0 z-10 border-b border-[var(--color-border)] bg-white/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <Link
            to="/"
            className="flex items-center gap-3 text-xl font-semibold tracking-tight text-[var(--color-text)]"
          >
            <span className="flex size-10 items-center justify-center rounded-xl bg-[var(--color-primary)] text-sm font-bold text-white shadow-sm">
              S
            </span>
            Studify
          </Link>

          <nav className="flex flex-wrap items-center gap-1 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-1 text-sm font-medium shadow-[var(--shadow-card)]">
            <NavLink to="/dashboard" className={navLinkClass}>
              Dashboard
            </NavLink>
            <NavLink to="/tasks" className={navLinkClass}>
              Tasks
            </NavLink>
            <NavLink to="/subjects" className={navLinkClass}>
              Subjects
            </NavLink>
          </nav>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-7xl flex-col px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
