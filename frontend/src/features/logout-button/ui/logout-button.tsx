import { cn } from "@/shared/lib/cn";
import { useLogout } from "@/features/logout-button/model";

export function LogoutButton() {
  const { mutate, isPending } = useLogout();

  return (
    <button
      type="button"
      onClick={() => mutate()}
      disabled={isPending}
      className={cn(
        "block w-full cursor-pointer px-4 py-2 text-left text-sm font-medium text-red-500",
        "bg-studify-surface rounded-lg transition-colors",
        "hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30",
        "focus-visible:bg-red-50 focus-visible:text-red-600 focus-visible:outline-none",
        isPending && "opacity-50 cursor-not-allowed",
      )}
    >
      {isPending ? "Logging out..." : "Log out"}
    </button>
  );
}
