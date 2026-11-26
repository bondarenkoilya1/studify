import { format, isValid, parseISO } from "date-fns";
import { ru } from "date-fns/locale";

export function formatStudyDate(value: string | Date, pattern = "d MMMM") {
  const date = typeof value === "string" ? parseISO(value) : value;
  return isValid(date) ? format(date, pattern, { locale: ru }) : "—";
}
