import type { ExamType } from "@/shared/api";

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

export interface SubjectPresentation {
  gradient: string;
  backgroundColor: string;
  borderColor: string;
}

const SCOPE_CALENDAR_COLORS: Record<
  string,
  Array<{ backgroundColor: string; borderColor: string }>
> = {
  technology: [
    { backgroundColor: "#dbeafe", borderColor: "#2563eb" },
    { backgroundColor: "#dbeafe", borderColor: "#1d4ed8" },
    { backgroundColor: "#e0e7ff", borderColor: "#4338ca" },
    { backgroundColor: "#cffafe", borderColor: "#0891b2" },
  ],
  healthcare: [
    { backgroundColor: "#ffe4e6", borderColor: "#e11d48" },
    { backgroundColor: "#ffe4e6", borderColor: "#be123c" },
    { backgroundColor: "#fee2e2", borderColor: "#b91c1c" },
    { backgroundColor: "#fce7f3", borderColor: "#e11d48" },
  ],
  humanities: [
    { backgroundColor: "#fef3c7", borderColor: "#d97706" },
    { backgroundColor: "#fef3c7", borderColor: "#b45309" },
    { backgroundColor: "#ffedd5", borderColor: "#c2410c" },
    { backgroundColor: "#ffedd5", borderColor: "#d97706" },
  ],
  business: [
    { backgroundColor: "#d1fae5", borderColor: "#059669" },
    { backgroundColor: "#d1fae5", borderColor: "#047857" },
    { backgroundColor: "#ccfbf1", borderColor: "#0f766e" },
    { backgroundColor: "#ccfbf1", borderColor: "#0d9488" },
  ],
  social: [
    { backgroundColor: "#ede9fe", borderColor: "#7c3aed" },
    { backgroundColor: "#f3e8ff", borderColor: "#7c3aed" },
    { backgroundColor: "#e0e7ff", borderColor: "#4338ca" },
    { backgroundColor: "#fce7f3", borderColor: "#c026d3" },
  ],
  science: [
    { backgroundColor: "#cffafe", borderColor: "#0891b2" },
    { backgroundColor: "#e0f2fe", borderColor: "#0369a1" },
    { backgroundColor: "#cffafe", borderColor: "#0f766e" },
    { backgroundColor: "#ccfbf1", borderColor: "#0d9488" },
  ],
  other: [
    { backgroundColor: "#f4f4f5", borderColor: "#52525b" },
    { backgroundColor: "#f1f5f9", borderColor: "#334155" },
    { backgroundColor: "#f4f4f5", borderColor: "#52525b" },
    { backgroundColor: "#f4f4f5", borderColor: "#52525b" },
  ],
};

export function hashSubjectIndex(
  subjectId: string | number,
  length: number,
): number {
  return (
    Math.abs(
      String(subjectId)
        .split("")
        .reduce((acc, char) => ((acc << 5) - acc + char.charCodeAt(0)) | 0, 0),
    ) % length
  );
}

export function getSubjectPresentation(
  scope: string,
  subjectId: string | number,
): SubjectPresentation {
  const gradients =
    SCOPE_GRADIENTS[scope] ?? SCOPE_GRADIENTS.other!;
  const colors =
    SCOPE_CALENDAR_COLORS[scope] ?? SCOPE_CALENDAR_COLORS.other!;
  const index = hashSubjectIndex(subjectId, gradients.length);

  return {
    gradient: gradients[index] ?? gradients[0]!,
    backgroundColor:
      colors[index]?.backgroundColor ?? colors[0]!.backgroundColor,
    borderColor: colors[index]?.borderColor ?? colors[0]!.borderColor,
  };
}

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
