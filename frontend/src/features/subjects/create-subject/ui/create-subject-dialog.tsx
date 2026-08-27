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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";

import { useCreateSubjectForm } from "../model/use-create-subject-form";
import { Controller } from "react-hook-form";
import { DatePicker } from "@/shared/ui/date-picker";
import { cn } from "@/shared/lib/cn";
import {
  type CreateSubjectDialogProps,
  SCOPE_LABELS,
} from "@/features/subjects/create-subject/model/model";

export function CreateSubjectDialog({
  open,
  onOpenChange,
}: CreateSubjectDialogProps) {
  const form = useCreateSubjectForm(() => {
    onOpenChange(false);
    form.reset();
  });

  const subjectType = form.watch("type");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogClose onClick={() => onOpenChange(false)} />

      <DialogHeader>
        <DialogTitle>Новый предмет</DialogTitle>
        <DialogDescription>
          Добавьте предмет, чтобы отслеживать его и даты экзаменов.
        </DialogDescription>
      </DialogHeader>

      <DialogBody>
        <form className="space-y-5" onSubmit={form.onSubmit}>
          {form.error && (
            <p className="rounded-xl bg-red-500/10 px-3 py-2.5 text-[13px] text-red-600">
              Не удалось создать предмет. Попробуйте ещё раз.
            </p>
          )}

          <FormField htmlFor="create-subject-type" label="Тип предмета">
            <Controller
              control={form.control}
              name="type"
              render={({ field }) => (
                <div
                  role="radiogroup"
                  aria-label="Тип предмета"
                  className="grid grid-cols-2 gap-1 rounded-xl bg-black/[0.05] p-1"
                >
                  <button
                    type="button"
                    role="radio"
                    aria-checked={field.value === "university"}
                    onClick={() => field.onChange("university")}
                    className={cn(
                      "rounded-[9px] px-3 py-2 text-[13px] font-medium",
                      "transition-all duration-150",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/30",
                      field.value === "university"
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-500 hover:text-gray-700",
                    )}
                  >
                    Университет
                  </button>

                  <button
                    type="button"
                    role="radio"
                    aria-checked={field.value === "personal"}
                    onClick={() => field.onChange("personal")}
                    className={cn(
                      "rounded-[9px] px-3 py-2 text-[13px] font-medium",
                      "transition-all duration-150",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/30",
                      field.value === "personal"
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-500 hover:text-gray-700",
                    )}
                  >
                    Личный
                  </button>
                </div>
              )}
            />
          </FormField>

          {/* Name */}
          <FormField htmlFor="create-subject-name" label="Название">
            <Input
              id="create-subject-name"
              placeholder={
                subjectType === "university"
                  ? "Английский язык"
                  : "Изучение английского"
              }
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

          {/* Note */}
          <FormField htmlFor="create-subject-note" label="Заметка">
            <textarea
              id="create-subject-note"
              placeholder="Дополнительная информация о предмете"
              maxLength={200}
              rows={3}
              aria-invalid={Boolean(form.formState.errors.note)}
              {...form.register("note")}
              className={cn(
                "w-full resize-none rounded-xl border border-gray-200",
                "bg-white px-3.5 py-3 text-[14px] text-gray-900",
                "placeholder:text-gray-400",
                "outline-none transition-colors",
                "focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10",
                form.formState.errors.note &&
                  "border-red-500 focus:border-red-500 focus:ring-red-500/10",
              )}
            />

            <div className="mt-1.5 flex items-start justify-between gap-3">
              {form.formState.errors.note?.message ? (
                <p className="text-[13px] text-red-500">
                  {form.formState.errors.note.message}
                </p>
              ) : (
                <span />
              )}

              <span className="shrink-0 text-[12px] text-gray-400">
                {form.watch("note").length}/200
              </span>
            </div>
          </FormField>

          {/* Scope */}
          <FormField htmlFor="create-subject-scope" label="Категория">
            <Controller
              control={form.control}
              name="scope"
              render={({ field, fieldState }) => (
                <>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger
                      id="create-subject-scope"
                      className="w-full"
                      aria-invalid={Boolean(fieldState.error)}
                    >
                      <SelectValue placeholder="Выберите категорию">
                        {(value: string) => SCOPE_LABELS[value] ?? value}
                      </SelectValue>
                    </SelectTrigger>

                    <SelectContent>
                      {Object.entries(SCOPE_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {fieldState.error?.message && (
                    <p className="mt-1.5 text-[13px] text-red-500">
                      {fieldState.error.message}
                    </p>
                  )}
                </>
              )}
            />
          </FormField>

          {/* Lecturer — only for university */}
          {subjectType === "university" && (
            <FormField htmlFor="create-subject-lecturer" label="Преподаватель">
              <Input
                id="create-subject-lecturer"
                placeholder="Дмитрий Сорокин"
                controlSize="large"
                aria-invalid={Boolean(form.formState.errors.lecturer)}
                {...form.register("lecturer")}
              />

              {form.formState.errors.lecturer?.message && (
                <p className="mt-1.5 text-[13px] text-red-500">
                  {form.formState.errors.lecturer.message}
                </p>
              )}
            </FormField>
          )}

          {/* Exam date — only for university */}
          {subjectType === "university" && (
            <FormField htmlFor="create-subject-exam-date" label="Дата экзамена">
              <Controller
                control={form.control}
                name="examDate"
                render={({ field, fieldState }) => (
                  <>
                    <DatePicker value={field.value} onChange={field.onChange} />

                    {fieldState.error?.message && (
                      <p className="mt-1.5 text-[13px] leading-snug text-red-500">
                        {fieldState.error.message}
                      </p>
                    )}
                  </>
                )}
              />
            </FormField>
          )}

          <DialogFooter>
            <Button
              type="submit"
              size="lg"
              disabled={form.isPending}
              className="w-full"
            >
              {form.isPending ? "Создаём..." : "Создать предмет"}
            </Button>
          </DialogFooter>
        </form>
      </DialogBody>
    </Dialog>
  );
}
