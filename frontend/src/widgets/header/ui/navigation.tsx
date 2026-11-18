import { Link } from "@tanstack/react-router";
import { cn } from "@/shared/lib/cn";

const linkClass = cn(
  "text-sm font-medium text-studify-muted transition-colors",
  "hover:text-studify-text",
);

export function HeaderNavigation() {
  return (
    <nav className="flex items-center gap-6">
      <Link
        to="/subjects"
        className={linkClass}
        activeProps={{
          className: "text-studify-text",
        }}
      >
        Предметы
      </Link>
      <Link
        to="/dashboard"
        className={linkClass}
        activeProps={{
          className: "text-studify-text",
        }}
      >
        Дашборд
      </Link>
      <Link
        to="/share"
        className={linkClass}
        activeProps={{
          className: "text-studify-text",
        }}
      >
        Общие проекты
      </Link>
      <Link
        to="/calendar"
        className={`${linkClass} group/nav flex items-center gap-2`}
        activeProps={{ className: "text-studify-text" }}
      >
        <span>Календарь экзаменов</span>
      </Link>
    </nav>
  );
}
