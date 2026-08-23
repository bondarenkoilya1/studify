import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { Button } from "@/shared/ui/button";
import { FormField } from "@/shared/ui/form-field";
import { Input } from "@/shared/ui/input";
import { Controller } from "react-hook-form";
import { DatePicker } from "@/shared/ui/date-picker";

import { useCreateTaskForm } from "../model/use-create-task-form";

type CreateTaskDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subjectId: number;
};

export function CreateTaskDialog({
  open,
  onOpenChange,
  subjectId,
}: CreateTaskDialogProps) {
  const form = useCreateTaskForm(subjectId, () => {
    onOpenChange(false);
    form.reset();
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogClose onClick={() => onOpenChange(false)} />

      <DialogHeader>
        <DialogTitle>Новая задача</DialogTitle>
        <DialogDescription>
          Добавьте задачу, чтобы отслеживать её выполнение и сроки.
        </DialogDescription>
      </DialogHeader>

      <DialogBody>
        <form className="space-y-5" onSubmit={form.onSubmit}>
          {form.error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-[13px] text-red-600">
              Не удалось создать задачу. Попробуйте ещё раз.
            </p>
          )}

          <FormField htmlFor="create-task-name" label="Название">
            <Input
              id="create-task-name"
              placeholder="Подготовиться к экзамену"
              controlSize="large"
              aria-invalid={Boolean(form.formState.errors.name)}
              {...form.register("name")}
            />

            {form.formState.errors.name?.message && (
              <p className="mt-1.5 text-[13px] text-red-500">
                {form.formState.errors.name.message}
              </p>
            )}
          </FormField>

          <FormField htmlFor="create-task-type" label="Тип">
            <select
              id="create-task-type"
              className="h-12 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
              aria-invalid={Boolean(form.formState.errors.type)}
              {...form.register("type")}
            >
              <option value="exam">Экзамен</option>
              <option value="credit">Зачёт</option>
              <option value="coursework">Курсовая</option>
              <option value="project">Проект</option>
              <option value="other">Другое</option>
            </select>

            {form.formState.errors.type?.message && (
              <p className="mt-1.5 text-[13px] text-red-500">
                {form.formState.errors.type.message}
              </p>
            )}
          </FormField>

          <FormField htmlFor="create-task-description" label="Описание">
            <textarea
              id="create-task-description"
              placeholder="Что нужно сделать?"
              rows={4}
              className="w-full resize-none rounded-xl border border-border bg-background px-3 py-3 text-sm outline-none transition focus:ring-2 focus:ring-ring"
              aria-invalid={Boolean(form.formState.errors.description)}
              {...form.register("description")}
            />

            {form.formState.errors.description?.message && (
              <p className="mt-1.5 text-[13px] text-red-500">
                {form.formState.errors.description.message}
              </p>
            )}
          </FormField>

          <FormField
            htmlFor="create-task-estimated-time"
            label="Примерное время (минуты)"
          >
            <Input
              id="create-task-estimated-time"
              type="number"
              min={1}
              placeholder="60"
              controlSize="large"
              aria-invalid={Boolean(form.formState.errors.estimatedTime)}
              {...form.register("estimatedTime", {
                setValueAs: (value) => (value === "" ? null : Number(value)),
              })}
            />

            {form.formState.errors.estimatedTime?.message && (
              <p className="mt-1.5 text-[13px] text-red-500">
                {form.formState.errors.estimatedTime.message}
              </p>
            )}
          </FormField>

          <FormField
            htmlFor="create-task-scheduled-at"
            label="Запланировано на"
          >
            <Controller
              control={form.control}
              name="scheduledAt"
              render={({ field, fieldState }) => (
                <>
                  <DatePicker
                    value={field.value ? new Date(field.value) : undefined}
                    onChange={(date) =>
                      field.onChange(date?.toISOString() ?? null)
                    }
                  />

                  {fieldState.error?.message && (
                    <p className="mt-1.5 text-[13px] leading-snug text-red-500">
                      {fieldState.error.message}
                    </p>
                  )}
                </>
              )}
            />
          </FormField>

          <FormField htmlFor="create-task-deadline" label="Дедлайн">
            <Controller
              control={form.control}
              name="deadline"
              render={({ field, fieldState }) => (
                <>
                  <DatePicker
                    value={field.value ? new Date(field.value) : undefined}
                    onChange={(date) =>
                      field.onChange(date?.toISOString() ?? null)
                    }
                  />

                  {fieldState.error?.message && (
                    <p className="mt-1.5 text-[13px] leading-snug text-red-500">
                      {fieldState.error.message}
                    </p>
                  )}
                </>
              )}
            />
          </FormField>

          <div className="grid grid-cols-3 gap-3">
            <FormField label="Статус" htmlFor="create-task-status">
              <select
                className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                {...form.register("status")}
              >
                <option value="not_completed">Не выполнено</option>
                <option value="ongoing">В процессе</option>
                <option value="completed">Выполнено</option>
              </select>
            </FormField>

            <FormField htmlFor="create-task-difficulty" label="Сложность">
              <select
                className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                {...form.register("difficulty")}
              >
                <option value="low">Низкая</option>
                <option value="medium">Средняя</option>
                <option value="high">Высокая</option>
              </select>
            </FormField>

            <FormField htmlFor="create-task-priority" label="Приоритет">
              <select
                className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                {...form.register("priority")}
              >
                <option value="low">Низкий</option>
                <option value="medium">Средний</option>
                <option value="high">Высокий</option>
              </select>
            </FormField>
          </div>

          <DialogFooter>
            <Button
              type="submit"
              size="lg"
              disabled={form.isPending}
              className="w-full"
            >
              {form.isPending ? "Создаём..." : "Создать задачу"}
            </Button>
          </DialogFooter>
        </form>
      </DialogBody>
    </Dialog>
  );
}
