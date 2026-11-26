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
import { FormError, FormField } from "@/shared/ui/form-field";
import { Input } from "@/shared/ui/input";
import { Controller } from "react-hook-form";
import type { Task } from "@/shared/api";
import { DatePicker } from "@/shared/ui/date-picker";

import { useCreateTaskForm } from "../model/use-create-task-form";

type CreateTaskDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subjectId: number;
  task?: Task;
};

export function CreateTaskDialog({
  open,
  onOpenChange,
  subjectId,
  task,
}: CreateTaskDialogProps) {
  const form = useCreateTaskForm(subjectId, task, () =>
    handleOpenChange(false),
  );

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      form.reset();
    }
    onOpenChange(nextOpen);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}
      className="max-h-[calc(100dvh-2rem)] overflow-y-auto"
    >
      <DialogClose />

      <DialogHeader>
        <DialogTitle>
          {task ? "Редактирование задачи" : "Новая задача"}
        </DialogTitle>
        <DialogDescription>
          {task
            ? "Измените параметры или сроки задачи."
            : "Добавьте задачу, чтобы отслеживать её выполнение и сроки."}
        </DialogDescription>
      </DialogHeader>

      <DialogBody>
        <form className="space-y-5" onSubmit={form.onSubmit}>
          {form.error && <FormError variant="summary">{form.error}</FormError>}

          <FormField htmlFor="create-task-name" label="Название">
            <Input
              id="create-task-name"
              placeholder="Подготовиться к экзамену"
              controlSize="large"
              aria-invalid={Boolean(form.formState.errors.name)}
              {...form.register("name")}
            />

            {form.formState.errors.name?.message && (
              <FormError>{form.formState.errors.name.message}</FormError>
            )}
          </FormField>

          <FormField htmlFor="create-task-type" label="Тип">
            <select
              id="create-task-type"
              className="form-control min-h-11"
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
              <FormError>{form.formState.errors.type.message}</FormError>
            )}
          </FormField>

          <FormField htmlFor="create-task-description" label="Описание">
            <textarea
              id="create-task-description"
              placeholder="Что нужно сделать?"
              rows={4}
              className="form-control resize-y"
              aria-invalid={Boolean(form.formState.errors.description)}
              {...form.register("description")}
            />

            {form.formState.errors.description?.message && (
              <FormError>{form.formState.errors.description.message}</FormError>
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
              aria-invalid={Boolean(form.formState.errors.estimated_time)}
              {...form.register("estimated_time", {
                setValueAs: (value) =>
                  value === "" || value === null ? null : Number(value),
              })}
            />

            {form.formState.errors.estimated_time?.message && (
              <FormError>
                {form.formState.errors.estimated_time.message}
              </FormError>
            )}
          </FormField>

          <FormField
            htmlFor="create-task-scheduled-at"
            label="Запланировано на"
          >
            <Controller
              control={form.control}
              name="scheduled_date"
              render={({ field, fieldState }) => (
                <>
                  <DatePicker
                    id="create-task-scheduled-at"
                    value={field.value ?? undefined}
                    clearable
                    clearLabel="Очистить дату выполнения"
                    disablePast={!task}
                    onChange={(date) => field.onChange(date ?? null)}
                  />

                  {fieldState.error?.message && (
                    <FormError>{fieldState.error.message}</FormError>
                  )}
                </>
              )}
            />
          </FormField>

          <FormField htmlFor="create-task-deadline" label="Дедлайн">
            <Controller
              control={form.control}
              name="deadline_date"
              render={({ field, fieldState }) => (
                <>
                  <DatePicker
                    id="create-task-deadline"
                    value={field.value ?? undefined}
                    clearable
                    clearLabel="Очистить дедлайн"
                    disablePast={!task}
                    onChange={(date) => field.onChange(date ?? null)}
                  />

                  {fieldState.error?.message && (
                    <FormError>{fieldState.error.message}</FormError>
                  )}
                </>
              )}
            />
          </FormField>

          <div className="grid gap-3 sm:grid-cols-3">
            <FormField label="Статус" htmlFor="create-task-status">
              <select
                id="create-task-status"
                className="form-control min-h-11"
                {...form.register("status")}
              >
                <option value="not_completed">Не выполнено</option>
                <option value="ongoing">В процессе</option>
                <option value="completed">Выполнено</option>
              </select>
            </FormField>

            <FormField htmlFor="create-task-difficulty" label="Сложность">
              <select
                id="create-task-difficulty"
                className="form-control min-h-11"
                {...form.register("difficulty")}
              >
                <option value="low">Низкая</option>
                <option value="medium">Средняя</option>
                <option value="high">Высокая</option>
              </select>
            </FormField>

            <FormField htmlFor="create-task-priority" label="Приоритет">
              <select
                id="create-task-priority"
                className="form-control min-h-11"
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
              disabled={
                form.isPending || (Boolean(task) && !form.formState.isDirty)
              }
              className="w-full"
            >
              {form.isPending
                ? "Сохраняем…"
                : task
                  ? "Сохранить изменения"
                  : "Создать задачу"}
            </Button>
          </DialogFooter>
        </form>
      </DialogBody>
    </Dialog>
  );
}
