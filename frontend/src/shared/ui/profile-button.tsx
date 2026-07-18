import { cn } from "@/shared/lib/cn";
import { useEffect, useRef, useState } from "react";
import { LogoutButton } from "@/features/logout-button/ui/logout-button";

type ProfileButtonProps = {
  userName: string;
  userId: number;
};

export function ProfileButton({ userName, userId }: ProfileButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-3 rounded-lg border border-studify-border bg-studify-surface px-4 py-2 text-sm",
          "shadow-sm transition-colors hover:bg-studify-field",
          "focus-visible:ring-studify-focus/50 focus-visible:outline-none focus-visible:ring-[3px]",
        )}
      >
        <span className="font-medium text-studify-text">{userName}</span>
        <span className="rounded-full bg-studify-primary/10 px-2 py-1 text-xs font-semibold text-studify-primary">
          ID: #{userId}
        </span>
      </button>

      {isOpen && (
        <div
          className={cn(
            "absolute right-0 top-full z-10 mt-2 min-w-max rounded-lg border border-studify-border",
            "bg-studify-surface shadow-lg",
          )}
        >
          <LogoutButton />
        </div>
      )}
    </div>
  );
}
