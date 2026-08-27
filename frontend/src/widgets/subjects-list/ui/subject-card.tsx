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
    <div
      className="
        group relative h-[300px] overflow-hidden
        rounded-[22px]
        border border-black/[0.06]
        bg-white
        shadow-[0_1px_1px_rgba(0,0,0,0.02),0_1px_3px_rgba(0,0,0,0.03)]
        transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]
        hover:-translate-y-[3px]
        hover:border-black/[0.05]
        hover:shadow-[0_16px_40px_-12px_rgba(0,0,0,0.14)]
      "
    >
      <Link
        to="/subjects/$id"
        params={{ id: subject.id }}
        className="block h-full p-6"
      >
        {/* Header */}
        <div className="flex items-start gap-3.5 pr-9">
          <div
            className={`
              flex size-11 shrink-0 items-center justify-center
              rounded-[13px]
              bg-gradient-to-br ${gradient}
              text-[14px] font-semibold tracking-tight text-white
              shadow-[inset_0_1px_0_rgba(255,255,255,0.3),inset_0_-1px_1px_rgba(0,0,0,0.06),0_6px_14px_-6px_rgba(0,0,0,0.35)]
            `}
          >
            {subject.name.slice(0, 2).toUpperCase()}
          </div>

          <div className="min-w-0 flex-1 pt-0.5">
            <h3
              title={subject.name}
              className="
                line-clamp-2
                text-[16px] font-semibold
                leading-[1.25]
                tracking-[-0.01em]
                text-neutral-900
              "
            >
              {subject.name}
            </h3>

            <p className="mt-0.5 text-[13px] text-neutral-500">
              {isUniversity ? "Университетский предмет" : "Личное обучение"}
            </p>
          </div>
        </div>

        {/* Note */}
        {subject.note && (
          <p
            title={subject.note}
            className="
              mt-4 line-clamp-2
              text-[13px] leading-[1.5]
              text-neutral-500
            "
          >
            {subject.note}
          </p>
        )}

        {/* Divider */}
        {(isUniversity && subject.lecturer) || examDate ? (
          <div className="my-4 h-px bg-black/[0.04]" />
        ) : null}

        {/* Meta */}
        <div className="space-y-3">
          {isUniversity && subject.lecturer && (
            <div className="flex min-w-0 items-center gap-2.5">
              <GraduationCap className="size-[15px] shrink-0 text-neutral-400" />

              <p
                title={subject.lecturer}
                className="truncate text-[13px] font-medium text-neutral-700"
              >
                {subject.lecturer}
              </p>
            </div>
          )}

          {examDate && (
            <div className="flex min-w-0 items-center gap-2.5">
              <CalendarDays className="size-[15px] shrink-0 text-neutral-400" />

              <p className="truncate text-[13px] font-medium text-neutral-700">
                {examDate}
              </p>
            </div>
          )}
        </div>

        {/* Bottom metadata */}
        <div className="absolute bottom-6 left-6 flex items-center gap-2">
          <span
            className="
              rounded-full
              bg-neutral-100
              px-2.5 py-1
              text-[11px] font-medium
              text-neutral-500
            "
          >
            {isUniversity ? "Университет" : "Личный"}
          </span>

          <span className="flex items-center gap-1.5 text-[11px] font-medium text-neutral-500">
            <span
              className={`size-1.5 shrink-0 rounded-full ${scopeDotColor}`}
            />
            {scopeLabel}
          </span>
        </div>
      </Link>

      {/* Actions */}
      <div
        className="
          absolute right-4 top-4
          opacity-0
          transition-opacity duration-200
          group-hover:opacity-100
        "
      >
        <DeleteSubjectButton id={subject.id} />
      </div>
    </div>
  );
}
