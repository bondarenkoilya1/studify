import type {
  TaskDifficulty,
  TaskStatus,
  TaskType,
  TaskPriority,
} from "@/entities/task/model/types";
import { useGetTasks } from "@/entities/task";
import { useTasksMetadata } from "@/entities/task/model/use-tasks-metadata";
import { useState } from "react";
import { Route } from "@/routes/_protected/subjects/$id";

export const STATUS_CONFIG: Record<
  TaskStatus,
  { label: string; dot: string; text: string }
> = {
  not_completed: {
    label: "Not started",
    dot: "bg-gray-300",
    text: "text-gray-400",
  },
  ongoing: {
    label: "In progress",
    dot: "bg-[#0A84FF]",
    text: "text-[#0A84FF]",
  },
  completed: {
    label: "Completed",
    dot: "bg-[#30B855]",
    text: "text-[#2FA84A]",
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
  low: "Easy",
  medium: "Medium",
  high: "Hard",
};

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

export const PRIORITY_CHIP: Record<
  TaskPriority,
  { bg: string; text: string } | null
> = {
  low: null,
  medium: {
    bg: "bg-amber-50",
    text: "text-amber-600",
  },
  high: {
    bg: "bg-red-50",
    text: "text-red-500",
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
