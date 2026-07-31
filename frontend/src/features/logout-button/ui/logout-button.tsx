import { cn } from "@/shared/lib/cn";
import { useLogout } from "@/features/logout-button/model";
import { LogOut } from "lucide-react";

interface Props {
  onLogout?: () => void;
}

export function LogoutButton({ onLogout }: Props) {
  const { mutate, isPending } = useLogout();

  const handleLogout = () => {
    mutate(undefined, {
      onSuccess: onLogout,
    });
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={isPending}
      className={cn(
        "flex w-full items-center gap-2 rounded-lg px-4 py-2",
        "text-left text-sm font-medium text-red-500",
        "transition-colors",
        "hover:bg-red-50 hover:text-red-600",
        "dark:hover:bg-red-950/30",
        "focus-visible:bg-red-50 focus-visible:text-red-600",
        "focus-visible:outline-none",
        "disabled:cursor-not-allowed disabled:opacity-50",
      )}
    >
      <LogOut className="h-4 w-4 shrink-0" />
      {isPending ? "Logging out..." : "Log out"}
    </button>
  );
}
