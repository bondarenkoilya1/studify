import { cn } from "@/shared/lib/cn";
import { useLogout } from "@/features/logout-button/model";
import { LogOut } from "lucide-react";

export function LogoutButton() {
  const { mutate, isPending } = useLogout();

  return (
    <button
      type="button"
      onClick={() => mutate()}
      disabled={isPending}
      className={cn(
        "flex w-full cursor-pointer items-center gap-2 px-4 py-2 text-left text-sm font-medium text-red-500",
        "bg-studify-surface rounded-lg transition-colors",
        "hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30",
        "focus-visible:bg-red-50 focus-visible:text-red-600 focus-visible:outline-none",
        isPending && "cursor-not-allowed opacity-50",
      )}
    >
      <LogOut className="h-4 w-4 shrink-0" />{" "}
      {isPending ? "Logging out..." : "Log out"}
    </button>
  );
}
