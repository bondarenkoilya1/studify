import { Controller, useFieldArray } from "react-hook-form";
import { X } from "lucide-react";

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
import { DatePicker } from "@/shared/ui/date-picker";
import { cn } from "@/shared/lib/cn";

import {
  LECTURER_POSITIONS,
  LECTURER_POSITION_LABELS,
  type CreateSubjectDialogProps,
  SCOPE_LABELS,
} from "@/features/subjects/create-subject/model/model";

import { useCreateSubjectForm } from "../model/use-create-subject-form";
import type { LecturerPosition } from "@/entities/subject/model/types";

const initialLecturers = [
  {
    name: "",
    position: "lecturer" as const,
  },
  {
    name: "",
    position: "practical_instructor" as const,
  },
];

// Единый focus-ring токен для всех интерактивных элементов формы —
// кастомные radio-кнопки, инпуты, селекты. Если этого не сделать,
// у каждого компонента будет свой ring/opacity и это подсознательно
// читается как "несколько разных UI-китов в одной форме".
const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/20";

// Единственная точка правды для текста ошибки под полем.
// Раньше в разных местах было text-[13px]/text-[12px], mt-1.5/без него —
// эти расхождения незаметны по отдельности, но глаз считывает
// их совокупность как "неаккуратно". Один компонент = один стиль везде.
function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1.5 text-[13px] text-red-500">{message}</p>;
}

// Схлопывающийся контейнер для полей, которые есть только у типа
// "university". grid-template-rows 0fr → 1fr — единственный способ
// анимировать "auto" высоту чистым CSS, без measure-hacks и без
// доп. библиотек. overflow-hidden на внутреннем div обязателен —
// иначе контент будет виден поверх схлопнутой области во время анимации.
function Collapse({
  open,
  children,
}: {
  open: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "grid transition-[grid-template-rows] duration-300 ease-out",
        open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
      )}
    >
      <div className="overflow-hidden">
        <div
          className={cn(
            "space-y-5 transition-opacity duration-200",
            open ? "opacity-100" : "opacity-0",
          )}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

export function CreateSubjectDialog({
  open,
  onOpenChange,
}: CreateSubjectDialogProps) {
  const form = useCreateSubjectForm(() => {
    onOpenChange(false);
  });

  const subjectType = form.watch("type");
  const note = form.watch("note");
  const isUniversity = subjectType === "university";

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "lecturers",
  });

  const addInitialLecturers = () => {
    if (fields.length === 0) {
      append(initialLecturers);
    }
  };

  const addLecturer = () => {
    append({
      name: "",
      position: LECTURER_POSITIONS[0],
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogClose onClick={() => onOpenChange(false)} />

      <DialogHeader>
        <DialogTitle>Новый предмет</DialogTitle>

        <DialogDescription>
          Добавьте предмет и основную информацию о нём.
        </DialogDescription>
      </DialogHeader>

      <DialogBody>
        <form onSubmit={form.submit} className="space-y-5">
          {form.error && (
            <div className="rounded-xl bg-red-500/10 px-3.5 py-2.5 text-[13px] text-red-600">
              Не удалось создать предмет. Попробуйте ещё раз.
            </div>
          )}

          {/* TYPE */}
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
                      "h-9 rounded-[9px] px-3 text-[13px] font-medium",
                      "transition-all duration-150",
                      FOCUS_RING,
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
                      "h-9 rounded-[9px] px-3 text-[13px] font-medium",
                      "transition-all duration-150",
                      FOCUS_RING,
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

          {/* NAME */}
          <FormField htmlFor="create-subject-name" label="Название">
            <Input
              id="create-subject-name"
              placeholder={
                isUniversity
                  ? "Например, Экономика: введение в экономику"
                  : "Например, Изучение английского"
              }
              controlSize="large"
              className={cn("h-11", FOCUS_RING)}
              aria-invalid={Boolean(form.formState.errors.name)}
              {...form.register("name")}
            />

            <FieldError message={form.formState.errors.name?.message} />
          </FormField>

          {/* SCOPE + DATE */}
          <div
            className={cn(
              "grid gap-4",
              isUniversity ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1",
            )}
          >
            {/* SCOPE */}
            <FormField htmlFor="create-subject-scope" label="Категория">
              <Controller
                control={form.control}
                name="scope"
                render={({ field, fieldState }) => (
                  <>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger
                        id="create-subject-scope"
                        className={cn("h-11 w-full", FOCUS_RING)}
                        aria-invalid={Boolean(fieldState.error)}
                      >
                        <SelectValue placeholder="Выберите категорию">
                          {(value: string) =>
                            SCOPE_LABELS[value as keyof typeof SCOPE_LABELS] ??
                            value
                          }
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

                    <FieldError message={fieldState.error?.message} />
                  </>
                )}
              />
            </FormField>

            {/* DATE — рендерим всегда, чтобы Collapse ниже мог его схлопнуть
                плавно; но т.к. DATE технически часть grid-раскладки со SCOPE,
                а не university-only блока, тут просто держим условный рендер
                как было — схлопывание анимируем только для лекторов и note-блока,
                где эффект от рывка высоты заметнее всего. Если хочешь анимировать
                и это поле — оберни весь grid в <Collapse open={isUniversity}>. */}
            {isUniversity && (
              <FormField
                htmlFor="create-subject-exam-date"
                label="Дата экзамена"
              >
                <Controller
                  control={form.control}
                  name="examDate"
                  render={({ field, fieldState }) => (
                    <>
                      <DatePicker
                        value={field.value}
                        onChange={field.onChange}
                        className={cn("h-11", FOCUS_RING)}
                      />

                      <FieldError message={fieldState.error?.message} />
                    </>
                  )}
                />
              </FormField>
            )}
          </div>

          {/* NOTE */}
          <FormField htmlFor="create-subject-note" label="Заметка">
            <div className="relative">
              <textarea
                id="create-subject-note"
                placeholder="Дополнительная информация о предмете"
                maxLength={200}
                rows={2}
                aria-invalid={Boolean(form.formState.errors.note)}
                {...form.register("note")}
                className={cn(
                  "w-full resize-none rounded-xl border border-gray-200",
                  "bg-white px-3.5 py-2.5 pr-16 text-[14px] text-gray-900",
                  "placeholder:text-gray-400",
                  "outline-none transition-all",
                  "focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10",
                  form.formState.errors.note &&
                    "border-red-500 focus:border-red-500 focus:ring-red-500/10",
                )}
              />

              <span className="absolute bottom-2.5 right-3 text-[11px] text-gray-400">
                {note.length}/200
              </span>
            </div>

            <FieldError message={form.formState.errors.note?.message} />
          </FormField>

          {/* LECTURERS — university-only, схлопывается плавно вместе с
              полем даты выше при переключении типа предмета */}
          <Collapse open={isUniversity}>
            <FormField htmlFor="create-subject-lecturers" label="Преподаватели">
              <div id="create-subject-lecturers" className="space-y-3">
                {fields.length === 0 ? (
                  <button
                    type="button"
                    onClick={addInitialLecturers}
                    className={cn(
                      "w-full rounded-xl border border-dashed",
                      "border-gray-300 px-4 py-3",
                      "text-[13px] font-medium text-gray-500",
                      "transition-all",
                      FOCUS_RING,
                      "hover:border-indigo-400 hover:bg-indigo-50/50 hover:text-indigo-600",
                    )}
                  >
                    + Добавить лектора и преподавателя практики
                  </button>
                ) : (
                  <>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {fields.map((field, index) => {
                        const nameError =
                          form.formState.errors.lecturers?.[index]?.name;

                        const positionError =
                          form.formState.errors.lecturers?.[index]?.position;

                        return (
                          <div
                            key={field.id}
                            className={cn(
                              "group relative rounded-xl border",
                              "border-gray-200 bg-gray-50/60 p-3",
                              "transition-colors",
                              "hover:border-gray-300",
                            )}
                          >
                            <div className="mb-2 flex items-center justify-between">
                              <span className="text-[11px] font-medium uppercase tracking-wide text-gray-400">
                                {index === 0
                                  ? "Лектор"
                                  : index === 1
                                    ? "Практика"
                                    : "Преподаватель"}
                              </span>

                              <button
                                type="button"
                                onClick={() => remove(index)}
                                aria-label="Удалить преподавателя"
                                className={cn(
                                  "flex size-6 items-center justify-center rounded-full text-gray-400 transition-colors",
                                  FOCUS_RING,
                                  "hover:bg-red-500/10 hover:text-red-500",
                                )}
                              >
                                <X className="size-3.5" />
                              </button>
                            </div>

                            <div className="space-y-2">
                              <Input
                                placeholder={
                                  index === 0
                                    ? "Имя лектора"
                                    : index === 1
                                      ? "Имя преподавателя практики"
                                      : "Имя преподавателя"
                                }
                                controlSize="large"
                                className={cn("h-11", FOCUS_RING)}
                                aria-invalid={Boolean(nameError)}
                                {...form.register(`lecturers.${index}.name`)}
                              />

                              <FieldError message={nameError?.message} />

                              <Controller
                                control={form.control}
                                name={`lecturers.${index}.position`}
                                render={({ field: positionField }) => (
                                  <Select
                                    value={positionField.value}
                                    onValueChange={positionField.onChange}
                                  >
                                    <SelectTrigger
                                      className={cn(
                                        "h-11 w-full bg-white",
                                        FOCUS_RING,
                                      )}
                                      aria-invalid={Boolean(positionError)}
                                    >
                                      <SelectValue>
                                        {(value: string) =>
                                          LECTURER_POSITION_LABELS[
                                            value as LecturerPosition
                                          ] ?? value
                                        }
                                      </SelectValue>
                                    </SelectTrigger>

                                    <SelectContent>
                                      {LECTURER_POSITIONS.map((position) => (
                                        <SelectItem
                                          key={position}
                                          value={position}
                                        >
                                          {LECTURER_POSITION_LABELS[position]}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                )}
                              />

                              <FieldError message={positionError?.message} />
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <button
                      type="button"
                      onClick={addLecturer}
                      className={cn(
                        "rounded text-[13px] font-medium text-indigo-600 transition-colors",
                        FOCUS_RING,
                        "hover:text-indigo-700",
                      )}
                    >
                      + Добавить преподавателя
                    </button>
                  </>
                )}

                {typeof form.formState.errors.lecturers?.message ===
                  "string" && (
                  <FieldError
                    message={form.formState.errors.lecturers.message}
                  />
                )}
              </div>
            </FormField>
          </Collapse>

          {/* FOOTER */}
          <DialogFooter className="mt-6 border-t border-gray-100 pt-4">
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
