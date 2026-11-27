import { lazy, Suspense, useEffect, useState } from "react";
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
import type { Subject, Task } from "@/shared/api";
import { DatePicker } from "@/shared/ui/date-picker";

import { useCreateTaskForm } from "../model/use-create-task-form";
import {
  clearTaskDraft,
  readTaskDraft,
  saveTaskDraft,
} from "../model/task-draft";

const CreateSubjectDialog = lazy(() =>
  import("@/features/subject/create-subject/ui/create-subject-dialog").then(
    (module) => ({
      default: module.CreateSubjectDialog,
    }),
  ),
);

const loadingSubjectForm = (
  <span role="status" className="sr-only">
    Открываем форму предмета
  </span>
);

type CreateTaskDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
} & (
  | { subjectId: number; task?: Task; subjects?: never; draftKey?: never }
  | { subjects: Subject[]; draftKey: string; subjectId?: never; task?: never }
);

export function CreateTaskDialog({
  open,
  onOpenChange,
  subjectId,
  subjects,
  draftKey,
  task,
}: CreateTaskDialogProps) {
  const [expanded, setExpanded] = useState(false);
  const [subjectDialogOpen, setSubjectDialogOpen] = useState(false);
  const [draft] = useState(() => readTaskDraft(draftKey));
  const draftSubjectId =
    draft?.subject_id && subjects?.some(({ id }) => id === draft.subject_id)
      ? draft.subject_id
      : undefined;
  const defaultSubjectId =
    subjectId ?? (subjects?.length === 1 ? subjects[0]?.id : undefined) ?? 0;
  const form = useCreateTaskForm(
    defaultSubjectId,
    task,
    () => {
      const savedSubject = form.getValues("subject_id");
      form.reset();
      if (subjects) {
        form.setValue("subject_id", savedSubject);
        setExpanded(false);
      }
      if (draftKey) clearTaskDraft(draftKey);
      onOpenChange(false);
    },
    draft
      ? { ...draft, subject_id: draftSubjectId ?? defaultSubjectId }
      : undefined,
  );
  const { subscribe } = form;

  useEffect(() => {
    if (!draftKey) return;
    return subscribe({
      formState: { values: true },
      callback: ({ values }) => saveTaskDraft(draftKey, values),
    });
  }, [draftKey, subscribe]);

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen && (form.isPending || subjectDialogOpen)) return;
    if (!nextOpen && task) form.reset();
    onOpenChange(nextOpen);
  }

  return (
    <>
      <Dialog
        open={open && !subjectDialogOpen}
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
              : subjects
                ? "Укажите название и предмет. Срок можно добавить позже."
                : "Добавьте задачу, чтобы отслеживать её выполнение и сроки."}
          </DialogDescription>
        </DialogHeader>

        <DialogBody>
          <form className="space-y-5" onSubmit={form.onSubmit}>
            {form.error && (
              <FormError variant="summary">{form.error}</FormError>
            )}

            <FormField htmlFor="create-task-name" label="Название">
              <Input
                id="create-task-name"
                placeholder="Подготовиться к экзамену"
                maxLength={200}
                controlSize="large"
                aria-invalid={Boolean(form.formState.errors.name)}
                aria-describedby={
                  form.formState.errors.name
                    ? "create-task-name-error"
                    : undefined
                }
                {...form.register("name")}
              />

              {form.formState.errors.name?.message && (
                <FormError id="create-task-name-error">
                  {form.formState.errors.name.message}
                </FormError>
              )}
            </FormField>

            {subjects && (
              <FormField htmlFor="create-task-subject" label="Предмет">
                <select
                  id="create-task-subject"
                  className="form-control min-h-11"
                  aria-invalid={Boolean(form.formState.errors.subject_id)}
                  aria-describedby={
                    form.formState.errors.subject_id
                      ? "create-task-subject-error"
                      : undefined
                  }
                  {...form.register("subject_id", { valueAsNumber: true })}
                >
                  <option value={0} disabled>
                    Выберите предмет
                  </option>
                  {subjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name}
                    </option>
                  ))}
                </select>
                <FormError id="create-task-subject-error">
                  {form.formState.errors.subject_id?.message}
                </FormError>
                <Button
                  type="button"
                  variant="ghost"
                  className="mt-1 min-h-10"
                  disabled={form.isPending}
                  onClick={() => setSubjectDialogOpen(true)}
                >
                  Добавить предмет
                </Button>
              </FormField>
            )}

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

            {subjects && (
              <Button
                type="button"
                variant="outline"
                className="min-h-11"
                aria-expanded={expanded}
                aria-controls="task-details"
                onClick={() => setExpanded(!expanded)}
              >
                Дополнительные параметры
              </Button>
            )}

            <div
              id="task-details"
              hidden={Boolean(subjects) && !expanded}
              className="space-y-5"
            >
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
                  maxLength={2000}
                  aria-invalid={Boolean(form.formState.errors.description)}
                  {...form.register("description")}
                />

                {form.formState.errors.description?.message && (
                  <FormError>
                    {form.formState.errors.description.message}
                  </FormError>
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
      {subjectDialogOpen && (
        <Suspense fallback={loadingSubjectForm}>
          <CreateSubjectDialog
            open
            onOpenChange={setSubjectDialogOpen}
            onCreated={(subject) =>
              form.setValue("subject_id", subject.id, {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
          />
        </Suspense>
      )}
    </>
  );
}
