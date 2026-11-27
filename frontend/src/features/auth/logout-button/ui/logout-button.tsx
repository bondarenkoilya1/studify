import { cn } from "@/shared/lib/cn";
import { useLogout } from "../model/use-logout";
import { LogOut } from "lucide-react";

export function LogoutButton() {
  const { mutate, isPending } = useLogout();

  return (
    <button
      type="button"
      onClick={() => mutate()}
      disabled={isPending}
      className={cn(
        "flex min-h-11 w-full items-center gap-2 rounded-lg px-3 py-2",
        "text-left text-sm font-medium text-destructive",
        "transition-colors",
        "hover:bg-destructive/10 focus-visible:bg-destructive/10",
        "focus-visible:ring-2 focus-visible:ring-ring",
        "disabled:cursor-not-allowed disabled:opacity-50",
      )}
    >
      <LogOut className="h-4 w-4 shrink-0" />
      {isPending ? "Выходим…" : "Выйти"}
    </button>
  );
}
