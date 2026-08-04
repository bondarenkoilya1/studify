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

      {/* потом */}
      {/* <Link to="/tasks">Tasks</Link> */}
      {/* <Link to="/dashboard">Dashboard</Link> */}
    </nav>
  );
}
