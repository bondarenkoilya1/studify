import { formatISO, isValid, parseISO } from "date-fns";
import { z } from "zod";
import { createTaskSchema, type CreateTaskFormValues } from "./schema";

const draftDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .transform((value) => parseISO(value))
  .refine(isValid)
  .nullable();

const storedDraft = createTaskSchema
  .extend({
    subject_id: z.number().int().nonnegative(),
    name: z.string().max(200),
    description: z.string().max(2000),
    estimated_time: z.number().nullable(),
    scheduled_date: draftDate,
    deadline_date: draftDate,
  })
  .partial();

export function readTaskDraft(key: string | undefined) {
  if (!key) return undefined;
  try {
    const value = window.sessionStorage.getItem(key);
    return value ? storedDraft.safeParse(JSON.parse(value)).data : undefined;
  } catch {
    return undefined;
  }
}

function writeTaskDraft(key: string, value: string | null) {
  try {
    if (value === null) window.sessionStorage.removeItem(key);
    else window.sessionStorage.setItem(key, value);
  } catch {
    // The form still retains the draft in memory when storage is unavailable.
  }
}

function formatDraftDate(value: Date | null) {
  return value && isValid(value)
    ? formatISO(value, { representation: "date" })
    : null;
}

export function saveTaskDraft(key: string, values: CreateTaskFormValues) {
  writeTaskDraft(
    key,
    JSON.stringify({
      ...values,
      scheduled_date: formatDraftDate(values.scheduled_date),
      deadline_date: formatDraftDate(values.deadline_date),
    }),
  );
}

export function clearTaskDraft(key: string) {
  writeTaskDraft(key, null);
}
