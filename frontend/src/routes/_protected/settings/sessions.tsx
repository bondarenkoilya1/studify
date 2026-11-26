import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { formatStudyDate } from "@/shared/lib/study-date";
import {
  Globe2,
  Laptop,
  LoaderCircle,
  LogOut,
  Monitor,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  Tablet,
  Trash2,
} from "lucide-react";
import {
  getGetUserSessionsQueryOptions,
  invalidateGetUserSessions,
  useGetUserSessionsSuspense,
  useLogoutAllSessions,
  useLogoutUser,
  useRevokeSession,
  type Session,
} from "@/shared/api";
import { endSession } from "@/entities/user";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { toast } from "@/shared/ui/sonner";

export const Route = createFileRoute("/_protected/settings/sessions")({
  loader: ({ context: { queryClient } }) =>
    queryClient.ensureQueryData(getGetUserSessionsQueryOptions()),
  pendingComponent: SessionsSkeleton,
  component: RouteComponent,
});

function RouteComponent() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [dialog, setDialog] = useState<SessionDialog>(null);
  const sessionsQuery = useGetUserSessionsSuspense();

  const logoutCurrentMutation = useLogoutUser({
    mutation: {
      onSuccess: async () => {
        endSession(queryClient);
        await navigate({ to: "/login" });
      },
      onError: (err) => {
        toast.error(err.message || "Не удалось выйти из текущей сессии");
      },
    },
  });

  const logoutAllMutation = useLogoutAllSessions({
    mutation: {
      onSuccess: async () => {
        endSession(queryClient);
        await navigate({ to: "/login" });
      },
      onError: (err) => {
        toast.error(err.message || "Не удалось завершить сессии");
      },
    },
  });

  const revokeSessionMutation = useRevokeSession({
    mutation: {
      onSuccess: async () => {
        await invalidateGetUserSessions(queryClient);
        setDialog(null);
        toast.success("Сессия завершена");
      },
      onError: (err) => {
        toast.error(err.message || "Не удалось завершить сессию");
      },
    },
  });

  const sessions = sessionsQuery.data;
  const isMutating =
    logoutCurrentMutation.isPending ||
    logoutAllMutation.isPending ||
    revokeSessionMutation.isPending;

  return (
    <>
      <div className="flex flex-col gap-6">
        <div className="overflow-hidden rounded-2xl border bg-card shadow-xs">
          <div className="relative p-6 sm:p-8">
            <div className="pointer-events-none absolute -right-20 -top-24 size-64 rounded-full bg-primary/10 blur-3xl" />

            <div className="relative flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
              <div className="max-w-xl">
                <div className="mb-3 flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <ShieldCheck className="size-5" />
                </div>

                <h2 className="text-xl font-semibold tracking-tight">
                  Ваши сессии
                </h2>

                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Здесь отображаются устройства, с которых вы входили в аккаунт.
                  Если вы видите незнакомую активность, завершите эту сессию.
                </p>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => sessionsQuery.refetch()}
                disabled={sessionsQuery.isFetching || isMutating}
              >
                <RefreshCw
                  className={sessionsQuery.isFetching ? "animate-spin" : ""}
                />
                Обновить
              </Button>
            </div>
          </div>

          <div className="grid border-t sm:grid-cols-2">
            <div className="flex items-center gap-3 p-5 sm:px-8">
              <div className="flex size-9 items-center justify-center rounded-xl bg-muted">
                <Laptop className="size-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-semibold leading-none">
                  {sessions.length}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {sessions.length === 1
                    ? "активное устройство"
                    : "активных устройств"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 border-t p-5 sm:border-l sm:border-t-0 sm:px-8">
              <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-500/10">
                <ShieldCheck className="size-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-medium">Аккаунт защищён</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Регулярно проверяйте список устройств
                </p>
              </div>
            </div>
          </div>
        </div>

        {sessions.length === 0 ? (
          <div className="rounded-2xl border border-dashed bg-card p-10 text-center shadow-xs">
            <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-muted">
              <Laptop className="size-5 text-muted-foreground" />
            </div>
            <h3 className="mt-4 font-medium">Активных сессий пока нет</h3>
            <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
              После следующего входа устройство появится в этом списке.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border bg-card shadow-xs">
            <div className="flex items-center justify-between gap-4 border-b px-6 py-4 sm:px-8">
              <div>
                <h3 className="font-semibold">Устройства</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Последняя активность отсортирована сверху
                </p>
              </div>
              <span className="hidden rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground sm:inline-flex">
                {sessions.length}
              </span>
            </div>

            <div className="divide-y">
              {sessions.map((session) => (
                <SessionRow
                  key={session.id}
                  session={session}
                  isCurrent={session.is_current}
                  disabled={isMutating}
                  onRevoke={(isCurrent) =>
                    setDialog({
                      type: isCurrent ? "current" : "remote",
                      id: session.id,
                    })
                  }
                />
              ))}
            </div>
          </div>
        )}

        <div className="rounded-2xl border border-destructive/20 bg-destructive/[0.03] p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
                <LogOut className="size-4" />
              </div>
              <div>
                <p className="text-sm font-medium">Завершить все сессии</p>
                <p className="mt-1 max-w-lg text-sm text-muted-foreground">
                  Выйдите из аккаунта на всех устройствах, где выполнен вход.
                </p>
              </div>
            </div>

            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => setDialog({ type: "all" })}
              disabled={isMutating}
            >
              Выйти везде
            </Button>
          </div>
        </div>
      </div>

      <ConfirmSessionDialog
        type={dialog}
        isPending={isMutating}
        onOpenChange={(open) => {
          if (!open && !isMutating) setDialog(null);
        }}
        onConfirm={() => {
          if (dialog?.type === "all") {
            logoutAllMutation.mutate();
          } else if (dialog?.type === "current") {
            logoutCurrentMutation.mutate();
          } else if (dialog?.type === "remote") {
            revokeSessionMutation.mutate({ id: dialog.id });
          }
        }}
      />
    </>
  );
}

function SessionRow({
  session,
  isCurrent,
  disabled,
  onRevoke,
}: {
  session: Session;
  isCurrent: boolean;
  disabled: boolean;
  onRevoke: (isCurrent: boolean) => void;
}) {
  const DeviceIcon = getDeviceIcon(session.device);
  const lastLogin = formatStudyDate(session.last_login, "d MMMM yyyy, HH:mm");

  return (
    <div className="group flex flex-col gap-4 px-6 py-5 transition-colors hover:bg-muted/30 sm:flex-row sm:items-center sm:px-8">
      <div className="flex min-w-0 flex-1 items-center gap-4">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl border bg-muted/50 text-muted-foreground">
          <DeviceIcon className="size-5" />
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate font-medium">
              {session.browser || "Неизвестный браузер"}
            </p>
            <span
              className={
                isCurrent
                  ? "rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary"
                  : "rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-400"
              }
            >
              {isCurrent ? "Это устройство" : "Активна"}
            </span>
          </div>

          <p className="mt-1 truncate text-sm text-muted-foreground">
            {[session.os, session.device].filter(Boolean).join(" · ") ||
              "Устройство не определено"}
          </p>

          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Globe2 className="size-3.5" />
              {session.country || "Местоположение неизвестно"}
            </span>
            <span>Последняя активность: {lastLogin}</span>
          </div>
        </div>
      </div>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="self-end text-muted-foreground hover:text-destructive sm:self-center"
        onClick={() => onRevoke(isCurrent)}
        disabled={disabled}
      >
        {isCurrent ? <LogOut /> : <Trash2 />}
        {isCurrent ? "Выйти" : "Завершить"}
      </Button>
    </div>
  );
}

function SessionsSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border bg-card shadow-xs">
      <div className="border-b px-6 py-4 sm:px-8">
        <div className="h-4 w-28 animate-pulse rounded bg-muted" />
        <div className="mt-2 h-3 w-56 animate-pulse rounded bg-muted" />
      </div>
      <div className="divide-y">
        {[1, 2].map((item) => (
          <div key={item} className="flex items-center gap-4 px-6 py-6 sm:px-8">
            <div className="size-11 animate-pulse rounded-2xl bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-40 animate-pulse rounded bg-muted" />
              <div className="h-3 w-56 animate-pulse rounded bg-muted" />
              <div className="h-3 w-72 animate-pulse rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ConfirmSessionDialog({
  type,
  isPending,
  onOpenChange,
  onConfirm,
}: {
  type: SessionDialog;
  isPending: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) {
  const isAll = type?.type === "all";
  const isCurrent = type?.type === "current";

  return (
    <Dialog
      open={type !== null}
      onOpenChange={onOpenChange}
      className="max-w-md"
    >
      <DialogClose onClick={() => onOpenChange(false)} />
      <DialogHeader className="items-start text-left">
        <div className="flex size-11 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
          {isAll ? (
            <LogOut className="size-5" />
          ) : (
            <Trash2 className="size-5" />
          )}
        </div>
        <DialogTitle className="mt-2">
          {isAll
            ? "Завершить все сессии?"
            : isCurrent
              ? "Выйти с этого устройства?"
              : "Завершить эту сессию?"}
        </DialogTitle>
        <DialogDescription>
          {isAll
            ? "Вы выйдете из аккаунта на всех устройствах. На текущем устройстве потребуется войти снова."
            : isCurrent
              ? "Внимание: текущая сессия будет немедленно закрыта, а вы выйдете из аккаунта в этом браузере. Несохранённые данные могут быть потеряны. Для продолжения потребуется снова войти."
              : "Доступ к аккаунту на этом устройстве будет закрыт."}
        </DialogDescription>
      </DialogHeader>

      <DialogBody>
        {isCurrent && (
          <div className="rounded-xl border border-destructive/20 bg-destructive/[0.06] px-3.5 py-3 text-sm text-destructive">
            Это действие нельзя отменить после выхода. Убедитесь, что вы
            действительно хотите завершить текущую сессию.
          </div>
        )}

        <DialogFooter className="mt-0 flex-row justify-end">
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={() => onOpenChange(false)}
          >
            Отмена
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={isPending}
            onClick={onConfirm}
          >
            {isPending && <LoaderCircle className="animate-spin" />}
            {isAll ? "Завершить все" : isCurrent ? "Да, выйти" : "Завершить"}
          </Button>
        </DialogFooter>
      </DialogBody>
    </Dialog>
  );
}

type SessionDialog =
  | { type: "all" }
  | { type: "current"; id: number }
  | { type: "remote"; id: number }
  | null;

function getDeviceIcon(device: string) {
  const value = device.toLowerCase();

  if (value.includes("phone") || value.includes("mobile")) {
    return Smartphone;
  }

  if (value.includes("tablet") || value.includes("ipad")) {
    return Tablet;
  }

  return Monitor;
}
