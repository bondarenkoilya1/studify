import type {
  TaskDifficulty,
  TaskStatus,
  TaskType,
  TaskPriority,
} from "@/shared/api";

export const STATUS_CONFIG: Record<
  TaskStatus,
  { label: string; dot: string; text: string }
> = {
  not_completed: {
    label: "Не начато",
    dot: "bg-muted-foreground/50",
    text: "text-muted-foreground",
  },
  ongoing: {
    label: "В процессе",
    dot: "bg-primary",
    text: "text-primary",
  },
  completed: {
    label: "Выполнено",
    dot: "bg-emerald-500",
    text: "text-emerald-600 dark:text-emerald-400",
  },
};

export const TYPE_LABELS: Record<TaskType, string> = {
  exam: "Экзамен",
  credit: "Зачёт",
  coursework: "Курсовая",
  project: "Проект",
  other: "Другое",
};

export const DIFFICULTY_LEVEL: Record<TaskDifficulty, 1 | 2 | 3> = {
  low: 1,
  medium: 2,
  high: 3,
};

export const DIFFICULTY_LABELS: Record<TaskDifficulty, string> = {
  low: "Легко",
  medium: "Средне",
  high: "Сложно",
};

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: "Низкий",
  medium: "Средний",
  high: "Высокий",
};

export const PRIORITY_CHIP: Record<
  TaskPriority,
  { bg: string; text: string } | null
> = {
  low: null,
  medium: {
    bg: "bg-amber-500/10",
    text: "text-amber-700 dark:text-amber-400",
  },
  high: {
    bg: "bg-destructive/10",
    text: "text-destructive",
  },
};

export const TYPE_ORDER: TaskType[] = [
  "exam",
  "credit",
  "coursework",
  "project",
  "other",
];

export function getTaskCountLabel(count: number) {
  if (count % 10 === 1 && count % 100 !== 11) {
    return "задача";
  }

  if (
    count % 10 >= 2 &&
    count % 10 <= 4 &&
    (count % 100 < 10 || count % 100 >= 20)
  ) {
    return "задачи";
  }

  return "задач";
}
