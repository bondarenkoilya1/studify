import React, { useState } from "react";
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
  EXAM_TYPES,
  LECTURER_POSITIONS,
  LECTURER_POSITION_LABELS,
  SCOPE_LABELS,
  TERM_LABELS,
  TERM_OPTIONS,
  type CreateSubjectDialogProps,
} from "../model/constants";
import { useCreateSubjectForm } from "../model/use-create-subject-form";
import type { CreateSubjectFormValues } from "../model/schema";
import { EXAM_TYPE_LABELS } from "@/entities/subject/model/presentation";

/* -------------------------------------------------------------------------- */
/* Константы                                                                  */
/* -------------------------------------------------------------------------- */

const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/20";

/** Select без рамки: выглядит как значение справа в строке, а не как поле. */
const ROW_SELECT_TRIGGER = cn(
  "h-11 w-auto max-w-full justify-end gap-1.5 rounded-lg border-0 bg-transparent",
  "px-0 text-[14px] text-gray-500 shadow-none",
  FOCUS_RING,
);

type SubjectType = CreateSubjectFormValues["type"];

interface Option {
  value: string;
  label: string;
}

const SUBJECT_TYPE_OPTIONS: { value: SubjectType; label: string }[] = [
  { value: "university", label: "Университет" },
  { value: "personal", label: "Личный" },
];

// Опции собираем один раз на уровне модуля, а не на каждый рендер.
const SCOPE_SELECT_OPTIONS: Option[] = Object.entries(SCOPE_LABELS).map(
  ([value, label]) => ({ value, label }),
);

const COURSE_SELECT_OPTIONS: Option[] = COURSE_OPTIONS.map((course) => ({
  value: String(course),
  label: COURSE_LABELS[course],
}));

const TERM_SELECT_OPTIONS: Option[] = TERM_OPTIONS.map((term) => ({
  value: String(term),
  label: TERM_LABELS[term],
}));

const EXAM_TYPE_SELECT_OPTIONS: Option[] = EXAM_TYPES.map((type) => ({
  value: type,
  label: EXAM_TYPE_LABELS[type],
}));

const LECTURER_POSITION_SELECT_OPTIONS: Option[] = LECTURER_POSITIONS.map(
  (position) => ({
    value: position,
    label: LECTURER_POSITION_LABELS[position],
  }),
);

/* -------------------------------------------------------------------------- */
/* Мелкие UI-компоненты                                                       */
/* -------------------------------------------------------------------------- */

function FieldError({
  message,
  className,
}: {
  message?: string;
  className?: string;
}) {
  if (!message) return null;

  return (
    <p className={cn("text-[12px] text-red-500", className)} role="alert">
      {message}
    </p>
  );
}

/**
 * Плавно сворачивает блок. `inert` убирает скрытые поля из Tab-порядка
 * и из дерева доступности (нужен React 19; в React 18 пиши inert="").
 * Отрицательный margin гасит gap родителя, пока блок закрыт.
 */
function Collapse({
  open,
  children,
}: {
  open: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      inert={!open}
      className={cn(
        "grid transition-[grid-template-rows,margin] duration-300 ease-out",
        open ? "mt-0 grid-rows-[1fr]" : "-mt-5 grid-rows-[0fr]",
      )}
    >
      <div className="overflow-hidden">
        <div
          className={cn(
            "flex flex-col gap-5 transition-opacity duration-200",
            open ? "opacity-100" : "opacity-0",
          )}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

/** Скруглённая карточка со строками, между строками тонкие разделители. */
function FormGroup({
  title,
  error,
  children,
}: {
  title?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      {title && (
        <h3 className="mb-1.5 px-1 text-[13px] text-gray-500">{title}</h3>
      )}

      <div className="divide-y divide-gray-200/70 overflow-hidden rounded-xl bg-gray-50">
        {children}
      </div>

      <FieldError message={error} className="mt-1.5 px-1" />
    </section>
  );
}

/** Строка «подпись слева, значение справа». */
function FormRow({
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
    <div className="px-3.5">
      <div className="flex min-h-11 items-center justify-between gap-3">
        <label htmlFor={htmlFor} className="shrink-0 text-[14px] text-gray-900">
          {label}
        </label>

        <div className="flex min-w-0 justify-end">{children}</div>
      </div>

      <FieldError message={error} className="pb-2 text-right" />
    </div>
  );
}

interface SelectRowProps {
  id: string;
  label: string;
  value: string | undefined;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  error?: string;
}

/** Строка с Select внутри: одна реализация вместо четырёх копий. */
function SelectRow({
  id,
  label,
  value,
  onChange,
  options,
  placeholder = "Выбрать",
  error,
}: SelectRowProps) {
  const labels = new Map(options.map((option) => [option.value, option.label]));

  return (
    <FormRow label={label} htmlFor={id} error={error}>
      <Select
        value={value}
        onValueChange={(next) => next !== null && onChange(next)}
      >
        <SelectTrigger
          id={id}
          className={ROW_SELECT_TRIGGER}
          aria-invalid={Boolean(error)}
        >
          <SelectValue placeholder={placeholder}>
            {(selected: string) => labels.get(selected) ?? selected}
          </SelectValue>
        </SelectTrigger>

        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FormRow>
  );
}

/** Сегментированный переключатель в стиле iOS. */
function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
  ariaLabel,
}: {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string }[];
  ariaLabel: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className="grid auto-cols-fr grid-flow-col gap-1 rounded-xl bg-black/[0.05] p-1"
    >
      {options.map((option) => {
        const selected = option.value === value;

        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option.value)}
            className={cn(
              "h-9 rounded-[9px] px-3 text-[13px] font-medium transition-all duration-150",
              FOCUS_RING,
              selected
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Диалог                                                                     */
/* -------------------------------------------------------------------------- */

export function CreateSubjectDialog({
  open,
  onOpenChange,
}: CreateSubjectDialogProps) {
  const form = useCreateSubjectForm(() => onOpenChange(false));

  const isUniversity = form.watch("type") === "university";
  const note = form.watch("note");

  // Заметка скрыта, пока пользователь не нажал «Добавить заметку».
  // Если текст уже есть, поле остаётся открытым.
  const [noteOpen, setNoteOpen] = useState(false);
  const showNote = noteOpen || note.length > 0;

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "lecturers",
  });

  const errors = form.formState.errors;

  const lecturersError =
    typeof errors.lecturers?.message === "string"
      ? errors.lecturers.message
      : undefined;

  const addLecturer = () =>
    append({ name: "", position: LECTURER_POSITIONS[0] });

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
        <form onSubmit={form.submit} className="flex flex-col gap-5">
          {errors.root?.message && (
            <div
              role="alert"
              className="rounded-xl bg-red-500/10 px-3.5 py-2.5 text-[13px] text-red-600"
            >
              {errors.root.message}
            </div>
          )}

          {/* Тип предмета */}
          <Controller
            control={form.control}
            name="type"
            render={({ field }) => (
              <SegmentedControl
                ariaLabel="Тип предмета"
                value={field.value}
                onChange={field.onChange}
                options={SUBJECT_TYPE_OPTIONS}
              />
            )}
          />

          {/* Название */}
          <div>
            <Input
              id="create-subject-name"
              aria-label="Название"
              placeholder={
                isUniversity
                  ? "Например, Экономика: введение в экономику"
                  : "Например, Изучение английского"
              }
              controlSize="large"
              className={cn("h-12 text-[16px] font-medium", FOCUS_RING)}
              aria-invalid={Boolean(errors.name)}
              {...form.register("name")}
            />

            <FieldError
              message={errors.name?.message}
              className="mt-1.5 px-1"
            />
          </div>

          {/* Категория (нужна всегда) */}
          <FormGroup>
            <Controller
              control={form.control}
              name="scope"
              render={({ field, fieldState }) => (
                <SelectRow
                  id="create-subject-scope"
                  label="Категория"
                  placeholder="Выбрать категорию"
                  value={field.value}
                  onChange={field.onChange}
                  options={SCOPE_SELECT_OPTIONS}
                  error={fieldState.error?.message}
                />
              )}
            />
          </FormGroup>

          {/* Всё, что относится только к университету */}
          <Collapse open={isUniversity}>
            <FormGroup title="Учёба">
              <Controller
                control={form.control}
                name="course"
                render={({ field, fieldState }) => (
                  <SelectRow
                    id="create-subject-course"
                    label="Курс"
                    value={
                      field.value == null ? undefined : String(field.value)
                    }
                    onChange={(value) => field.onChange(Number(value))}
                    options={COURSE_SELECT_OPTIONS}
                    error={fieldState.error?.message}
                  />
                )}
              />

              <Controller
                control={form.control}
                name="term"
                render={({ field, fieldState }) => (
                  <SelectRow
                    id="create-subject-term"
                    label="Семестр"
                    value={
                      field.value == null ? undefined : String(field.value)
                    }
                    onChange={(value) => field.onChange(Number(value))}
                    options={TERM_SELECT_OPTIONS}
                    error={fieldState.error?.message}
                  />
                )}
              />
            </FormGroup>

            <FormGroup title="Аттестация">
              <Controller
                control={form.control}
                name="examType"
                render={({ field, fieldState }) => (
                  <SelectRow
                    id="create-subject-exam-type"
                    label="Форма"
                    value={field.value}
                    onChange={field.onChange}
                    options={EXAM_TYPE_SELECT_OPTIONS}
                    error={fieldState.error?.message}
                  />
                )}
              />

              <Controller
                control={form.control}
                name="examDate"
                render={({ field, fieldState }) => (
                  <FormRow
                    label="Дата"
                    htmlFor="create-subject-exam-date"
                    error={fieldState.error?.message}
                  >
                    <DatePicker
                      value={field.value}
                      onChange={field.onChange}
                      className={cn(
                        "h-11 border-0 bg-transparent px-0 text-[14px] text-gray-500 shadow-none",
                        FOCUS_RING,
                      )}
                    />
                  </FormRow>
                )}
              />
            </FormGroup>

            <FormGroup title="Преподаватели" error={lecturersError}>
              {fields.map((field, index) => {
                const rowError = errors.lecturers?.[index];

                return (
                  <div key={field.id} className="px-3.5">
                    <div className="flex min-h-11 items-center gap-2">
                      <input
                        aria-label={`Имя преподавателя ${index + 1}`}
                        placeholder="Имя преподавателя"
                        aria-invalid={Boolean(rowError?.name)}
                        className={cn(
                          "h-11 min-w-0 flex-1 bg-transparent text-[14px] text-gray-900",
                          "outline-none placeholder:text-gray-400",
                        )}
                        {...form.register(`lecturers.${index}.name`)}
                      />

                      <Controller
                        control={form.control}
                        name={`lecturers.${index}.position`}
                        render={({ field: positionField }) => {
                          const labels = LECTURER_POSITION_LABELS as Record<
                            string,
                            string
                          >;

                          return (
                            <Select
                              value={positionField.value}
                              onValueChange={positionField.onChange}
                            >
                              <SelectTrigger
                                aria-label="Должность"
                                className={ROW_SELECT_TRIGGER}
                                aria-invalid={Boolean(rowError?.position)}
                              >
                                <SelectValue>
                                  {(value: string) => labels[value] ?? value}
                                </SelectValue>
                              </SelectTrigger>

                              <SelectContent>
                                {LECTURER_POSITION_SELECT_OPTIONS.map(
                                  (option) => (
                                    <SelectItem
                                      key={option.value}
                                      value={option.value}
                                    >
                                      {option.label}
                                    </SelectItem>
                                  ),
                                )}
                              </SelectContent>
                            </Select>
                          );
                        }}
                      />

                      <button
                        type="button"
                        onClick={() => remove(index)}
                        aria-label="Удалить преподавателя"
                        className={cn(
                          "flex size-6 shrink-0 items-center justify-center rounded-full",
                          "text-gray-400 transition-colors",
                          "hover:bg-red-500/10 hover:text-red-500",
                          FOCUS_RING,
                        )}
                      >
                        <X className="size-3.5" />
                      </button>
                    </div>

                    <FieldError
                      message={
                        rowError?.name?.message ?? rowError?.position?.message
                      }
                      className="pb-2"
                    />
                  </div>
                );
              })}

              <button
                type="button"
                onClick={addLecturer}
                className={cn(
                  "flex min-h-11 w-full items-center gap-2 px-3.5 text-left",
                  "text-[14px] font-medium text-indigo-600 transition-colors",
                  "hover:bg-indigo-50/60",
                  FOCUS_RING,
                )}
              >
                <Plus className="size-4" />
                Добавить преподавателя
              </button>
            </FormGroup>
          </Collapse>

          {/* Заметка */}
          {showNote ? (
            <FormGroup title="Заметка" error={errors.note?.message}>
              <div className="relative">
                <textarea
                  id="create-subject-note"
                  aria-label="Заметка"
                  placeholder="Дополнительная информация о предмете"
                  maxLength={200}
                  rows={3}
                  autoFocus={noteOpen}
                  aria-invalid={Boolean(errors.note)}
                  className={cn(
                    "w-full resize-none bg-transparent px-3.5 pb-7 pt-3 text-[14px]",
                    "text-gray-900 outline-none placeholder:text-gray-400",
                  )}
                  {...form.register("note")}
                />

                <span className="absolute bottom-2 right-3.5 text-[11px] text-gray-400">
                  {note.length}/200
                </span>
              </div>
            </FormGroup>
          ) : (
            <button
              type="button"
              onClick={() => setNoteOpen(true)}
              className={cn(
                "flex w-fit items-center gap-1.5 rounded text-[13px] font-medium",
                "text-indigo-600 transition-colors hover:text-indigo-700",
                FOCUS_RING,
              )}
            >
              <Plus className="size-4" />
              Добавить заметку
            </button>
          )}

          <DialogFooter className="mt-1 border-t border-gray-100 pt-4">
            <Button
              type="submit"
              size="lg"
              disabled={form.isPending}
              className="w-full"
            >
              {form.isPending ? "Создаём…" : "Создать предмет"}
            </Button>
          </DialogFooter>
        </form>
      </DialogBody>
    </Dialog>
  );
}
