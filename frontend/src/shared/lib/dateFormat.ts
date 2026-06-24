const dateFormatter = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
  year: "numeric",
});

type DateValue = Date | string | null | undefined;

function parseDate(date: DateValue) {
  if (!date) {
    return null;
  }

  if (date instanceof Date) {
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const dateOnlyPattern = /^\d{4}-\d{2}-\d{2}$/;
  const parsedDate = new Date(dateOnlyPattern.test(date) ? `${date}T00:00:00` : date);

  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  return parsedDate;
}

export function dateInputToDate(date: string) {
  return parseDate(date);
}

export function dateToDateInputValue(date: DateValue) {
  const parsedDate = parseDate(date);
  if (!parsedDate) {
    return "";
  }

  const year = parsedDate.getFullYear();
  const month = String(parsedDate.getMonth() + 1).padStart(2, "0");
  const day = String(parsedDate.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function formatDate(date: DateValue) {
  const parsedDate = parseDate(date);

  if (!parsedDate) {
    return typeof date === "string" ? date : "";
  }

  return dateFormatter.format(parsedDate);
}

export function formatOptionalDate(date: DateValue, fallback = "No date") {
  return date ? formatDate(date) : fallback;
}

export function isOverdueDate(date: DateValue) {
  const parsedDate = parseDate(date);
  if (!parsedDate) {
    return false;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return parsedDate < today;
}
