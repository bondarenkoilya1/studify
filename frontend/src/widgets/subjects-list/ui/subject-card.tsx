import { CalendarDays, GraduationCap } from "lucide-react";
import { Link } from "@tanstack/react-router";

import { DeleteSubjectButton } from "@/features/subjects/delete-subject";
import type { Subject } from "@/entities/subject";
import { SCOPE_LABELS } from "@/features/subjects/create-subject/model/model";
import {
  SCOPE_DOT_COLORS,
  SCOPE_GRADIENTS,
} from "@/widgets/subjects-list/model/model";

interface SubjectCardProps {
  subject: Subject;
}

export function SubjectCard({ subject }: SubjectCardProps) {
  const scopeGradients =
    SCOPE_GRADIENTS[subject.scope] ?? SCOPE_GRADIENTS.other;
  const gradient = scopeGradients[subject.id % scopeGradients.length];

  const examDate = subject.examDate
    ? new Date(subject.examDate).toLocaleDateString("ru-RU", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  const isUniversity = subject.type === "university";
  const scopeLabel = SCOPE_LABELS[subject.scope] ?? subject.scope;
  const scopeDotColor = SCOPE_DOT_COLORS[subject.scope] ?? "bg-gray-400";

  return (
    <div className="group relative h-[280px] overflow-hidden rounded-2xl border border-black/[0.05] bg-background transition-all duration-200 hover:-translate-y-0.5 hover:border-black/[0.1] hover:shadow-lg">
      <Link
        to="/subjects/$id"
        params={{ id: subject.id }}
        className="block h-full p-6"
      >
        {/* Header */}
        <div className="flex items-start gap-4 pr-10">
          <div
            className={`flex size-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} text-base font-semibold text-white shadow-sm`}
          >
            {subject.name.slice(0, 2).toUpperCase()}
          </div>

          <div className="min-w-0 flex-1">
            <h3
              title={subject.name}
              className="line-clamp-2 text-lg font-semibold leading-tight tracking-tight text-foreground"
            >
              {subject.name}
            </h3>

            <p className="mt-1 text-sm text-muted-foreground">
              {isUniversity ? "Университетский предмет" : "Личное обучение"}
            </p>
          </div>
        </div>

        {/* Meta */}
        <div className="mt-8 space-y-5">
          {/* Lecturer */}
          {isUniversity && subject.lecturer && (
            <div className="flex min-w-0 items-center gap-3">
              <GraduationCap className="size-4 shrink-0 text-muted-foreground" />

              <div className="min-w-0">
                <p
                  title={subject.lecturer}
                  className="truncate text-sm font-medium"
                >
                  {subject.lecturer}
                </p>

                <p className="text-xs text-muted-foreground">Преподаватель</p>
              </div>
            </div>
          )}

          {/* Exam date */}
          {examDate && (
            <div className="flex items-center gap-3">
              <CalendarDays className="size-4 shrink-0 text-muted-foreground" />

              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{examDate}</p>

                <p className="text-xs text-muted-foreground">Дата экзамена</p>
              </div>
            </div>
          )}
        </div>

        {/* Type + Scope */}
        <div className="absolute bottom-6 left-6 flex items-center gap-2">
          <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
            {isUniversity ? "Университет" : "Личный"}
          </span>

          <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <span className="text-muted-foreground/40">·</span>
            <span
              className={`size-1.5 shrink-0 rounded-full ${scopeDotColor}`}
            />
            {scopeLabel}
          </span>
        </div>
      </Link>

      <div className="absolute right-6 top-6">
        <DeleteSubjectButton id={subject.id} />
      </div>
    </div>
  );
}
