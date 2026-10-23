import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { LogOut } from "lucide-react";
import { useLogoutAllSessions } from "@/shared/api";
import { endSession } from "@/entities/user";
import { Button } from "@/shared/ui/button";
import { toast } from "@/shared/ui/sonner";

export const Route = createFileRoute("/_protected/settings/sessions")({
  component: RouteComponent,
});

function RouteComponent() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const logoutAllMutation = useLogoutAllSessions({
    mutation: {
      onSettled: async () => {
        endSession(queryClient);
        await navigate({ to: "/login" });
      },
      onError: (err) => {
        toast.error(err.message || "Не удалось завершить сессии");
      },
    },
  });

  const handleLogoutAll = () => {
    logoutAllMutation.mutate();
  };

  return (
    <div className="flex flex-col gap-6 md:flex-row">
      <div className="min-w-0 flex-1 rounded-2xl border bg-card p-6 shadow-xs">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Сессии</h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Управление активными сессиями аккаунта.
          </p>
        </div>

        <div className="my-6 border-t" />

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Вы можете выйти из аккаунта на всех устройствах, где выполнен вход.
          </p>

          <div>
            <Button
              variant="destructive"
              onClick={handleLogoutAll}
              disabled={logoutAllMutation.isPending}
            >
              <LogOut className="size-4" />
              {logoutAllMutation.isPending
                ? "Выход..."
                : "Выход из всех сессий"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
