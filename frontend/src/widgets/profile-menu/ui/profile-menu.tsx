import { cn } from "@/shared/lib/cn";
import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { LogoutButton } from "@/features/logout-button";
import { Settings, Shield } from "lucide-react";

interface ProfileMenuProps {
  email: string;
  userId: number;
}

const itemClassName = cn(
  "block w-full px-4 py-2 text-left text-sm font-medium text-studify-text",
  "bg-studify-surface hover:bg-studify-field transition-colors rounded-lg",
  "focus-visible:bg-studify-field focus-visible:outline-none",
);

const menuItems = [
  {
    label: "Settings",
    to: "/settings/profile",
    icon: Settings,
  },
  {
    label: "Security",
    to: "/settings/security",
    icon: Shield,
  },
] as const;

export function ProfileMenu({ email, userId }: ProfileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const closeMenu = () => setIsOpen(false);
  const toggleMenu = () => setIsOpen((prev) => !prev);

  useEffect(() => {
    if (!isOpen) return;

    function handlePointerDown(event: PointerEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        closeMenu();
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeMenu();
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={toggleMenu}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        className={cn(
          "flex items-center gap-3 rounded-lg border border-studify-border bg-studify-surface px-4 py-2 text-sm",
          "shadow-sm transition-colors hover:bg-studify-field",
          "focus-visible:ring-studify-focus/50 focus-visible:outline-none focus-visible:ring-[3px]",
        )}
      >
        <span className="font-medium text-studify-text">{email}</span>
        <span className="rounded-full bg-studify-primary/10 px-2 py-1 text-xs font-semibold text-studify-primary">
          ID: #{userId}
        </span>
      </button>

      {isOpen && (
        <div
          role="menu"
          className={cn(
            "absolute right-0 top-full z-10 mt-2 w-48 rounded-lg border border-studify-border",
            "bg-studify-surface p-1 shadow-lg flex flex-col gap-0.5",
          )}
        >
          {menuItems.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(itemClassName, "flex items-center gap-2")}
                onClick={closeMenu}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}

          <div className="h-px bg-studify-border my-1" />

          <div role="menuitem" onClick={closeMenu}>
            <LogoutButton />
          </div>
        </div>
      )}
    </div>
  );
}
