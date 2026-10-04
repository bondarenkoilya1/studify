import type { ExamType } from "@/entities/subject/model/types";

export const SCOPE_GRADIENTS: Record<string, string[]> = {
  technology: [
    "from-blue-400 to-blue-600",
    "from-sky-500 to-blue-700",
    "from-blue-500 to-indigo-700",
    "from-cyan-500 to-blue-600",
  ],
  healthcare: [
    "from-rose-400 to-rose-600",
    "from-pink-500 to-rose-700",
    "from-rose-500 to-red-700",
    "from-fuchsia-500 to-rose-600",
  ],
  humanities: [
    "from-amber-400 to-amber-600",
    "from-yellow-500 to-amber-700",
    "from-amber-500 to-orange-700",
    "from-orange-400 to-amber-600",
  ],
  business: [
    "from-emerald-400 to-emerald-600",
    "from-green-500 to-emerald-700",
    "from-emerald-500 to-teal-700",
    "from-teal-400 to-emerald-600",
  ],
  social: [
    "from-violet-400 to-violet-600",
    "from-purple-500 to-violet-700",
    "from-violet-500 to-indigo-700",
    "from-fuchsia-500 to-violet-600",
  ],
  science: [
    "from-cyan-400 to-cyan-600",
    "from-sky-500 to-cyan-700",
    "from-cyan-500 to-teal-700",
    "from-teal-400 to-cyan-600",
  ],
  other: [
    "from-gray-400 to-gray-600",
    "from-slate-500 to-gray-700",
    "from-gray-500 to-zinc-700",
    "from-zinc-400 to-gray-600",
  ],
};

export const SCOPE_DOT_COLORS: Record<string, string> = {
  technology: "bg-blue-500",
  healthcare: "bg-rose-500",
  humanities: "bg-amber-500",
  business: "bg-emerald-500",
  social: "bg-violet-500",
  science: "bg-cyan-500",
  other: "bg-gray-400",
};

export const COURSE_COLORS: Record<number, string> = {
  1: "bg-blue-50 text-blue-700",
  2: "bg-emerald-50 text-emerald-700",
  3: "bg-violet-50 text-violet-700",
  4: "bg-amber-50 text-amber-700",
  5: "bg-rose-50 text-rose-700",
  6: "bg-cyan-50 text-cyan-700",
};

export const TERM_COLORS: Record<number, string> = {
  1: "bg-sky-50 text-sky-700",
  2: "bg-indigo-50 text-indigo-700",
  3: "bg-fuchsia-50 text-fuchsia-700",
  4: "bg-orange-50 text-orange-700",
};

export const EXAM_TYPE_LABELS: Record<ExamType, string> = {
  exam: "Экзамен",
  credit: "Зачёт",
  coursework: "Курсовая работа",
  project: "Проект",
  other: "Другое",
};
