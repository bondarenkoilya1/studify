import { Link } from "@tanstack/react-router";
import { cn } from "@/shared/lib/cn";
import { Hammer, HammerIcon } from "lucide-react";

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
        to="/soon"
        className={`${linkClass} group/nav flex items-center gap-2`}
        activeProps={{ className: "text-studify-text" }}
      >
        <span>Календарь экзаменов</span>

        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-600 dark:text-amber-400">
          <Hammer className="size-3 transition-transform duration-300 group-hover/nav:-rotate-12" />
          <span>Скоро</span>
        </span>
      </Link>
    </nav>
  );
}
