import { Link } from "@tanstack/react-router";
import { Menu } from "lucide-react";
import { useState } from "react";
import { buttonVariants } from "@/shared/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover";

const sections = [
  { to: "/subjects", label: "Предметы" },
  { to: "/dashboard", label: "Дашборд" },
  { to: "/share", label: "Общие проекты" },
  { to: "/calendar", label: "Календарь экзаменов" },
  { to: "/search", label: "Поиск" },
] as const;

function NavigationLinks({ onNavigate }: { onNavigate?: () => void }) {
  return sections.map(({ to, label }) => (
    <Link
      key={to}
      to={to}
      onClick={onNavigate}
      className="inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-medium whitespace-nowrap text-studify-muted hover:bg-studify-field hover:text-studify-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-studify-active aria-[current=page]:bg-studify-wash aria-[current=page]:font-semibold aria-[current=page]:text-studify-active"
    >
      {label}
    </Link>
  ));
}

export function HeaderNavigation() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <nav
        aria-label="Разделы Studify"
        className="mx-auto hidden min-w-0 items-center lg:flex"
      >
        <NavigationLinks />
      </nav>
      <div className="ml-auto lg:hidden">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger
            aria-label="Открыть навигацию"
            className={buttonVariants({
              variant: "ghost",
              size: "icon",
              className: "size-11",
            })}
          >
            <Menu className="size-5" aria-hidden="true" />
          </PopoverTrigger>
          <PopoverContent
            align="end"
            sideOffset={8}
            aria-label="Навигация"
            className="w-56 max-w-(--available-width) border border-studify-border bg-studify-surface p-1.5 lg:hidden"
          >
            <nav aria-label="Разделы Studify" className="flex flex-col gap-0.5">
              <NavigationLinks onNavigate={() => setOpen(false)} />
            </nav>
          </PopoverContent>
        </Popover>
      </div>
    </>
  );
}
