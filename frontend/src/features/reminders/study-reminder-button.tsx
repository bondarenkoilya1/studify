import { useId, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import {
  ApiError,
  deleteReminder,
  getGetReminderQueryKey,
  putReminder,
  type ReminderTarget,
  useGetReminder,
} from "@/shared/api";
import { getRequestErrorMessage } from "@/shared/api/request-error-message";
import { formatStudyDate } from "@/shared/lib/study-date";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { FormError, FormField } from "@/shared/ui/form-field";

const timingOptions = [
  [5, "За 5 минут"],
  [15, "За 15 минут"],
  [30, "За 30 минут"],
  [60, "За час"],
  [180, "За 3 часа"],
  [1440, "За сутки"],
  [2880, "За 2 суток"],
  [10080, "За неделю"],
] as const;

type ReminderProps = { target: ReminderTarget; id: number; name: string };

function reminderError(error: unknown) {
  if (error instanceof ApiError) {
    if (error.code === "reminder_time_passed")
      return "Это время уже прошло. Выберите меньший интервал.";
    if (error.code === "reminder_email_unverified")
      return "Подтвердите почту, чтобы получать напоминания.";
    if (error.code === "reminder_date_required")
      return "Добавьте будущий срок или дату события.";
    if (error.code === "reminder_already_handled")
      return "Напоминание на эту дату уже обработано.";
  }
  return getRequestErrorMessage(error, "Не удалось сохранить напоминание.");
}

function ReminderDialog({
  target,
  id,
  name,
  onClose,
}: ReminderProps & { onClose: () => void }) {
  const queryClient = useQueryClient();
  const timingId = useId();
  const [minutes, setMinutes] = useState<number>();
  const { data, isError, refetch } = useGetReminder(target, id, {
    query: { staleTime: 0 },
  });
  const key = getGetReminderQueryKey(target, id);
  const save = useMutation({
    meta: { inlineError: true },
    mutationFn: (lead: number) =>
      putReminder(target, id, {
        lead_minutes: lead,
        time_zone: data?.lead_minutes
          ? data.time_zone
          : Intl.DateTimeFormat().resolvedOptions().timeZone,
      }),
    onSuccess: (saved) => {
      queryClient.setQueryData(key, saved);
      setMinutes(undefined);
    },
  });
  const disable = useMutation({
    meta: { inlineError: true },
    mutationFn: () => deleteReminder(target, id),
    onSuccess: async () => {
      setMinutes(undefined);
      await queryClient.invalidateQueries({ queryKey: key });
    },
  });
  const pending = save.isPending || disable.isPending;
  const lead = minutes ?? data?.lead_minutes ?? 60;
  const when = data?.send_at;
  const activeEmail =
    data?.verified && data.event_at && Date.parse(data.event_at) > Date.now();
  const error = save.error ?? disable.error;

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !pending) onClose();
      }}
      className="max-w-md"
    >
      <DialogClose />
      <DialogHeader>
        <DialogTitle>Напоминание по почте</DialogTitle>
        <DialogDescription className="wrap-anywhere">{name}</DialogDescription>
      </DialogHeader>
      <DialogBody className="space-y-4">
        {!data &&
          (isError ? (
            <div className="space-y-2">
              <FormError variant="summary">
                Не удалось загрузить напоминание.
              </FormError>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => void refetch()}
              >
                Повторить
              </Button>
            </div>
          ) : (
            <p role="status" className="text-sm text-muted-foreground">
              Загружаем напоминание…
            </p>
          ))}
        {data && (
          <>
            {!data.verified && (
              <p className="text-sm text-muted-foreground">
                Подтвердите адрес почты в профиле, чтобы получать напоминания.
              </p>
            )}
            {data.verified && !activeEmail && (
              <p className="text-sm text-muted-foreground">
                Добавьте будущую дату{" "}
                {target === "task" ? "сдачи задачи" : "события предмета"}.
              </p>
            )}
            {data.outcome === "accepted" && (
              <p role="status" className="text-sm">
                Напоминание отправлено.
              </p>
            )}
            {data.outcome === "exhausted" && (
              <p role="status" className="text-sm">
                Доставить напоминание не удалось.
              </p>
            )}
            {activeEmail && !data.outcome && (
              <form
                className="space-y-4"
                onSubmit={(event) => {
                  event.preventDefault();
                  disable.reset();
                  if (!pending) save.mutate(lead);
                }}
              >
                {when && (
                  <p role="status" className="text-sm text-muted-foreground">
                    {Date.parse(when) <= Date.now()
                      ? "Ожидает отправки."
                      : `Запланировано на ${formatStudyDate(when, "d MMMM, HH:mm")} по времени устройства.`}
                  </p>
                )}
                <FormField
                  htmlFor={timingId}
                  label={
                    target === "task"
                      ? "Когда напомнить до сдачи"
                      : "Когда напомнить до события"
                  }
                >
                  <select
                    id={timingId}
                    className="form-control min-h-11"
                    value={lead}
                    disabled={pending}
                    onChange={(event) => {
                      save.reset();
                      setMinutes(Number(event.target.value));
                    }}
                  >
                    {!timingOptions.some(([value]) => value === lead) && (
                      <option value={lead}>За {lead} мин.</option>
                    )}
                    {timingOptions.map(([value, text]) => (
                      <option key={value} value={value}>
                        {text}
                      </option>
                    ))}
                  </select>
                </FormField>
                <Button type="submit" disabled={pending}>
                  {save.isPending ? "Сохраняем…" : "Сохранить"}
                </Button>
              </form>
            )}
            {data.lead_minutes !== null && (
              <Button
                type="button"
                variant="outline"
                disabled={pending}
                onClick={() => {
                  save.reset();
                  disable.mutate();
                }}
              >
                Выключить напоминание
              </Button>
            )}
            {error && (
              <FormError variant="summary">{reminderError(error)}</FormError>
            )}
          </>
        )}
      </DialogBody>
    </Dialog>
  );
}

export function StudyReminderButton({ target, id, name }: ReminderProps) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        type="button"
        variant="outline"
        size={target === "task" ? "icon" : "sm"}
        aria-label={`Напоминание «${name}»`}
        className={target === "task" ? "size-11" : "min-h-11"}
        onClick={() => setOpen(true)}
      >
        <Bell aria-hidden="true" />
        {target === "subject" && "Напоминание"}
      </Button>
      {open && (
        <ReminderDialog
          target={target}
          id={id}
          name={name}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
