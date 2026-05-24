import { type ReactNode } from 'react'
import { Link, NavLink } from 'react-router-dom'

type AppLayoutProps = {
  children: ReactNode
}

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  [
    'rounded-md px-3 py-2 transition hover:bg-slate-100 hover:text-slate-950',
    isActive ? 'bg-slate-100 text-slate-950' : '',
  ]
    .filter(Boolean)
    .join(' ')

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-[#f4f6f8]">
      <header className="border-b border-slate-200/80 bg-white/85 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <Link
            to="/"
            className="flex items-center gap-3 text-xl font-semibold tracking-tight text-slate-950"
          >
            <span className="flex size-9 items-center justify-center rounded-lg bg-blue-700 text-sm font-bold text-white shadow-sm">
              S
            </span>
            Studify
          </Link>

          <nav className="flex flex-wrap items-center gap-1 text-sm font-medium text-slate-600">
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
  )
}
