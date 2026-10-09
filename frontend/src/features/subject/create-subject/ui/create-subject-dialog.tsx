import { Controller, useFieldArray } from "react-hook-form";
import { Plus, X } from "lucide-react";

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
  COURSE_LABELS,
  COURSE_OPTIONS,
  LECTURER_POSITIONS,
  LECTURER_POSITION_LABELS,
  type CreateSubjectDialogProps,
  SCOPE_LABELS,
  TERM_LABELS,
  TERM_OPTIONS,
  EXAM_TYPES,
} from "../model/constants";

import { useCreateSubjectForm } from "../model/use-create-subject-form";
import type { LecturerPosition } from "@/shared/api";
import { EXAM_TYPE_LABELS } from "@/entities/subject/model/presentation";

const initialLecturers = [
  { name: "", position: "lecturer" as const },
  { name: "", position: "practical_instructor" as const },
];

const TYPE_OPTIONS = [
  { value: "university", label: "Университет" },
  { value: "personal", label: "Личный" },
] as const;

const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/20";

/* Селект и инпут внутри строки: без рамки и фона, значение прижато вправо */
const SELECT_INLINE = cn(
  "h-11 w-auto min-w-0 justify-end gap-1.5 border-0 bg-transparent px-0",
  "text-[15px] text-gray-500 shadow-none hover:bg-transparent",
  FOCUS_RING,
);

const INPUT_INLINE =
  "h-11 border-0 bg-transparent px-0 text-[15px] shadow-none focus:ring-0 focus-visible:ring-0";

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-[13px] text-red-500">{message}</p>;
}

/* Группа строк: одна серая «плашка», строки разделены тонкой линией */
function Group({
  title,
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-4">
      {title && (
        <h3 className="mb-1.5 px-4 text-[13px] text-gray-500">{title}</h3>
      )}
      <div
        className={cn(
          "overflow-hidden rounded-xl bg-black/[0.04]",
          // линия у каждой строки, кроме первой; начинается с отступа слева
          "[&>*+*>div:first-child]:border-t [&>*+*>div:first-child]:border-black/[0.07]",
        )}
      >
        {children}
      </div>
    </section>
  );
}

/* Строка: подпись слева, контрол справа, ошибка под контролом */
function Row({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string;
  htmlFor?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="pl-4">
      <div className="flex min-h-11 items-center justify-between gap-4 pr-4">
        <label htmlFor={htmlFor} className="shrink-0 text-[15px] text-gray-900">
          {label}
        </label>
        <div className="flex min-w-0 flex-1 justify-end">{children}</div>
      </div>
      {error && (
        <div className="pb-2 pr-4 text-right">
          <FieldError message={error} />
        </div>
      )}
    </div>
  );
}

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
            "transition-opacity duration-200",
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

  const addLecturer = () => {
    if (fields.length === 0) {
      append(initialLecturers);
      return;
    }
    append({ name: "", position: LECTURER_POSITIONS[0] });
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
        <form onSubmit={form.submit} className="flex flex-col">
          {form.formState.errors.root?.message && (
            <div className="mb-4 rounded-xl bg-red-500/10 px-3.5 py-2.5 text-[13px] text-red-600">
              {form.formState.errors.root.message}
            </div>
          )}

          {/* ТИП — сегментированный переключатель */}
          <Controller
            control={form.control}
            name="type"
            render={({ field }) => (
              <div
                role="radiogroup"
                aria-label="Тип предмета"
                className="grid grid-cols-2 gap-0.5 rounded-[10px] bg-black/[0.06] p-0.5"
              >
                {TYPE_OPTIONS.map((option) => {
                  const active = field.value === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => field.onChange(option.value)}
                      className={cn(
                        "h-8 rounded-lg px-3 text-[13px] font-medium",
                        "transition-all duration-150",
                        FOCUS_RING,
                        active
                          ? "bg-white text-gray-900 shadow-sm"
                          : "text-gray-500 hover:text-gray-700",
                      )}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            )}
          />

          {/* НАЗВАНИЕ — отдельная плашка без подписи, подпись в placeholder */}
          <section className="mt-4">
            <div className="rounded-xl bg-black/[0.04] px-4">
              <Input
                id="create-subject-name"
                aria-label="Название"
                placeholder={
                  isUniversity
                    ? "Название, например «Экономика»"
                    : "Название, например «Изучение английского»"
                }
                className={cn(INPUT_INLINE, "h-12 text-[17px]")}
                aria-invalid={Boolean(form.formState.errors.name)}
                {...form.register("name")}
              />
            </div>
            {form.formState.errors.name?.message && (
              <div className="mt-1.5 px-4">
                <FieldError message={form.formState.errors.name.message} />
              </div>
            )}
          </section>

          {/* ОСНОВНОЕ — категория, курс, семестр (+ экзамен для университета) */}
          <Group>
            <Controller
              control={form.control}
              name="scope"
              render={({ field, fieldState }) => (
                <Row
                  label="Категория"
                  htmlFor="create-subject-scope"
                  error={fieldState.error?.message}
                >
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger
                      id="create-subject-scope"
                      className={SELECT_INLINE}
                      aria-invalid={Boolean(fieldState.error)}
                    >
                      <SelectValue placeholder="Выбрать">
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
                </Row>
              )}
            />

            <Controller
              control={form.control}
              name="course"
              render={({ field, fieldState }) => (
                <Row
                  label="Курс"
                  htmlFor="create-subject-course"
                  error={fieldState.error?.message}
                >
                  <Select
                    value={
                      field.value === null || field.value === undefined
                        ? undefined
                        : String(field.value)
                    }
                    onValueChange={(value) => field.onChange(Number(value))}
                  >
                    <SelectTrigger
                      id="create-subject-course"
                      className={SELECT_INLINE}
                      aria-invalid={Boolean(fieldState.error)}
                    >
                      <SelectValue placeholder="Выбрать" />
                    </SelectTrigger>
                    <SelectContent>
                      {COURSE_OPTIONS.map((course) => (
                        <SelectItem key={course} value={String(course)}>
                          {COURSE_LABELS[course]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Row>
              )}
            />

            <Controller
              control={form.control}
              name="term"
              render={({ field, fieldState }) => (
                <Row
                  label="Семестр"
                  htmlFor="create-subject-term"
                  error={fieldState.error?.message}
                >
                  <Select
                    value={
                      field.value === null || field.value === undefined
                        ? undefined
                        : String(field.value)
                    }
                    onValueChange={(value) => field.onChange(Number(value))}
                  >
                    <SelectTrigger
                      id="create-subject-term"
                      className={SELECT_INLINE}
                      aria-invalid={Boolean(fieldState.error)}
                    >
                      <SelectValue placeholder="Выбрать" />
                    </SelectTrigger>
                    <SelectContent>
                      {TERM_OPTIONS.map((termOption) => (
                        <SelectItem key={termOption} value={String(termOption)}>
                          {TERM_LABELS[termOption]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Row>
              )}
            />

            {isUniversity && (
              <Controller
                control={form.control}
                name="examType"
                render={({ field, fieldState }) => (
                  <Row
                    label="Тип экзамена"
                    htmlFor="create-subject-exam-type"
                    error={fieldState.error?.message}
                  >
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger
                        id="create-subject-exam-type"
                        className={SELECT_INLINE}
                        aria-invalid={Boolean(fieldState.error)}
                      >
                        <SelectValue placeholder="Выбрать">
                          {(value: string) =>
                            EXAM_TYPE_LABELS[
                              value as keyof typeof EXAM_TYPE_LABELS
                            ] ?? value
                          }
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {EXAM_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {EXAM_TYPE_LABELS[type]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Row>
                )}
              />
            )}

            {isUniversity && (
              <Controller
                control={form.control}
                name="examDate"
                render={({ field, fieldState }) => (
                  <Row
                    label="Дата экзамена"
                    htmlFor="create-subject-exam-date"
                    error={fieldState.error?.message}
                  >
                    <DatePicker
                      value={field.value ?? undefined}
                      onChange={field.onChange}
                      className={SELECT_INLINE}
                    />
                  </Row>
                )}
              />
            )}
          </Group>

          {/* ЗАМЕТКА */}
          <Group>
            <div className="relative px-4 py-3">
              <textarea
                id="create-subject-note"
                aria-label="Заметка"
                placeholder="Заметка"
                maxLength={200}
                rows={2}
                aria-invalid={Boolean(form.formState.errors.note)}
                {...form.register("note")}
                className={cn(
                  "w-full resize-none bg-transparent pr-12 text-[15px]",
                  "text-gray-900 placeholder:text-gray-400 outline-none",
                )}
              />
              <span className="absolute bottom-3 right-4 text-[11px] text-gray-400">
                {note?.length ?? 0}/200
              </span>
            </div>
          </Group>
          {form.formState.errors.note?.message && (
            <div className="mt-1.5 px-4">
              <FieldError message={form.formState.errors.note.message} />
            </div>
          )}

          {/* ПРЕПОДАВАТЕЛИ — только для университета */}
          <Collapse open={isUniversity}>
            <Group title="Преподаватели">
              {fields.map((field, index) => {
                const nameError =
                  form.formState.errors.lecturers?.[index]?.name;
                const positionError =
                  form.formState.errors.lecturers?.[index]?.position;

                return (
                  <div key={field.id} className="pl-4">
                    <div className="flex min-h-11 items-center gap-2 pr-2">
                      <Input
                        aria-label="Имя преподавателя"
                        placeholder="Имя"
                        className={cn(INPUT_INLINE, "flex-1")}
                        aria-invalid={Boolean(nameError)}
                        {...form.register(`lecturers.${index}.name`)}
                      />

                      <Controller
                        control={form.control}
                        name={`lecturers.${index}.position`}
                        render={({ field: positionField }) => (
                          <Select
                            value={positionField.value}
                            onValueChange={positionField.onChange}
                          >
                            <SelectTrigger
                              aria-label="Должность"
                              className={SELECT_INLINE}
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
                                <SelectItem key={position} value={position}>
                                  {LECTURER_POSITION_LABELS[position]}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />

                      <button
                        type="button"
                        onClick={() => remove(index)}
                        aria-label="Удалить преподавателя"
                        className={cn(
                          "flex size-7 shrink-0 items-center justify-center",
                          "rounded-full text-gray-400 transition-colors",
                          FOCUS_RING,
                          "hover:bg-red-500/10 hover:text-red-500",
                        )}
                      >
                        <X className="size-3.5" />
                      </button>
                    </div>

                    {(nameError?.message || positionError?.message) && (
                      <div className="pb-2 pr-4">
                        <FieldError
                          message={nameError?.message ?? positionError?.message}
                        />
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Одна кнопка на оба случая: пустой список и «ещё один» */}
              <div className="pl-4">
                <button
                  type="button"
                  onClick={addLecturer}
                  className={cn(
                    "flex min-h-11 w-full items-center gap-2 pr-4 text-left",
                    "text-[15px] text-indigo-600 transition-colors",
                    FOCUS_RING,
                    "hover:text-indigo-700",
                  )}
                >
                  <Plus className="size-4" />
                  {fields.length === 0
                    ? "Добавить лектора и преподавателя практики"
                    : "Добавить преподавателя"}
                </button>
              </div>
            </Group>

            {typeof form.formState.errors.lecturers?.message === "string" && (
              <div className="mt-1.5 px-4">
                <FieldError message={form.formState.errors.lecturers.message} />
              </div>
            )}
          </Collapse>

          <DialogFooter className="mt-6">
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
