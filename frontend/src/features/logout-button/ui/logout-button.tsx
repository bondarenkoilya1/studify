import { cn } from "@/shared/lib/cn";
import { useLogout } from "@/features/logout-button/model";

export function LogoutButton() {
  const logoutMutation = useLogout();

  async function handleClick() {
    try {
      await logoutMutation.mutateAsync();
    } catch (err) {
      console.error("Logout failed", err);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={logoutMutation.isPending}
      aria-label="Log out"
      className={cn(
        "block w-full px-4 py-2 text-left text-sm font-medium text-red-500",
        "bg-studify-surface hover:bg-studify-field transition-colors rounded-lg",
        logoutMutation.isPending ? "opacity-50 cursor-not-allowed" : "",
      )}
    >
      {logoutMutation.isPending ? "Logging out..." : "Log out"}
    </button>
  );
}
