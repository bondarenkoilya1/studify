import React from "react";
import { CalendarDays, GraduationCap, type LucideIcon } from "lucide-react";
import { Link } from "@tanstack/react-router";

import { DeleteSubjectButton } from "@/features/subject/delete-subject";
import {
  LECTURER_POSITIONS,
  LECTURER_POSITION_LABELS,
  SCOPE_LABELS,
} from "@/features/subject/create-subject/model/constants";
import type { Subject } from "@/entities/subject";
import {
  COURSE_COLORS,
  EXAM_TYPE_LABELS,
  SCOPE_DOT_COLORS,
  SCOPE_GRADIENTS,
  TERM_COLORS,
} from "@/entities/subject/model/presentation";
import { publicEnv } from "@/shared/config";

const MAX_LECTURER_ROWS = 2;

const hashIndex = (val: string | number, max: number) =>
  Math.abs(
    String(val)
      .split("")
      .reduce((acc, ch) => ((acc << 5) - acc + ch.charCodeAt(0)) | 0, 0),
  ) % max;

function MetaRow({
  icon: Icon,
  children,
  title,
}: {
  icon: LucideIcon;
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <div className="flex min-w-0 items-center gap-2.5" title={title}>
      <Icon className="size-[15px] shrink-0 text-neutral-400" />
      <p className="truncate text-[13px] text-neutral-700">{children}</p>
    </div>
  );
}

export function SubjectCard({ subject }: { subject: Subject }) {
  const gradients = SCOPE_GRADIENTS[subject.scope] ?? SCOPE_GRADIENTS.other;

  const gradient = gradients[hashIndex(subject.id, gradients.length)];

  const isUniversity = subject.type === "university";

  // API may return null for an empty collection.
  // Keep the UI safe even before the backend contract is fixed.
  const lecturers = subject.lecturers ?? [];

  const examDate = subject.examDate
    ? new Date(subject.examDate).toLocaleDateString("ru-RU", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  const lecturerGroups = isUniversity
    ? LECTURER_POSITIONS.flatMap((pos) => {
        const names = lecturers
          .filter((lecturer) => lecturer.position === pos)
          .map((lecturer) => lecturer.name)
          .filter(Boolean)
          .join(", ");

        return names
          ? [{ pos, label: LECTURER_POSITION_LABELS[pos], names }]
          : [];
      })
    : [];

  const visibleLecturers = lecturerGroups.slice(0, MAX_LECTURER_ROWS);
  const hiddenCount = lecturerGroups.length - visibleLecturers.length;

  const thumbUrl = subject.thumbnailUrl
    ? `${publicEnv.apiBaseUrl.replace(/\/$/, "")}/${subject.thumbnailUrl.replace(/^\//, "")}`
    : null;

  const examTypeLabel = subject.examType
    ? (EXAM_TYPE_LABELS[subject.examType] ?? null)
    : null;

  const examInfo = [examTypeLabel, examDate].filter(Boolean).join(" · ");

  const hasMeta = visibleLecturers.length > 0 || Boolean(examInfo);

  return (
    <div className="group relative h-[300px] rounded-[22px] border border-black/[0.06] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.03)] transition-all duration-300 hover:-translate-y-[3px] hover:shadow-[0_16px_40px_-12px_rgba(0,0,0,0.14)]">
      <Link
        to="/subjects/$id"
        params={{ id: subject.id }}
        className="flex h-full flex-col rounded-[22px] p-6 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
      >
        {/* Header */}
        <div className="flex min-h-11 items-center gap-3.5 pr-8">
          {thumbUrl ? (
            <img
              src={thumbUrl}
              alt=""
              className="size-11 shrink-0 rounded-[13px] object-cover shadow-sm"
            />
          ) : (
            <div
              className={`flex size-11 shrink-0 items-center justify-center rounded-[13px] bg-gradient-to-br ${gradient} text-[14px] font-semibold text-white shadow-sm`}
            >
              {subject.name.slice(0, 2).toUpperCase()}
            </div>
          )}

          <h3
            title={subject.name}
            className="min-w-0 flex-1 line-clamp-2 text-[16px] font-semibold leading-tight tracking-[-0.01em] text-neutral-900"
          >
            {subject.name}
          </h3>
        </div>

        {/* Note */}
        {subject.note && (
          <p
            title={subject.note}
            className="mt-3 line-clamp-2 text-[13px] leading-[1.4] text-neutral-500"
          >
            {subject.note}
          </p>
        )}

        {/* Meta */}
        {hasMeta && (
          <div className="mt-3 space-y-2 border-t border-black/[0.04] pt-3">
            {visibleLecturers.map(({ pos, label, names }) => (
              <MetaRow
                key={pos}
                icon={GraduationCap}
                title={`${label}: ${names}`}
              >
                <span className="text-neutral-400">{label}: </span>

                <span className="font-medium text-neutral-700">{names}</span>
              </MetaRow>
            ))}

            {hiddenCount > 0 && (
              <p className="pl-[23px] text-[12px] text-neutral-400">
                +{hiddenCount} ещё
              </p>
            )}

            {examInfo && (
              <MetaRow icon={CalendarDays} title={examInfo}>
                <span className="font-medium text-neutral-700">{examInfo}</span>
              </MetaRow>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="mt-auto flex items-center gap-2 pt-4">
          <span className="shrink-0 rounded-full bg-neutral-100 px-2.5 py-0.5 text-[11px] font-medium text-neutral-600">
            {isUniversity ? "Университет" : "Личный"}
          </span>

          {subject.course && subject.term && (
            <span className="flex shrink-0 overflow-hidden rounded-full border border-black/[0.04] text-[11px] font-medium">
              <span
                className={`px-2.5 py-0.5 ${
                  COURSE_COLORS[subject.course] ??
                  "bg-neutral-100 text-neutral-600"
                }`}
              >
                {subject.course} курс
              </span>

              <span
                className={`border-l border-black/[0.06] px-2.5 py-0.5 ${
                  TERM_COLORS[subject.term] ?? "bg-neutral-100 text-neutral-600"
                }`}
              >
                {subject.term} семестр
              </span>
            </span>
          )}

          <span className="ml-auto flex min-w-0 items-center gap-1.5 text-[11px] font-medium text-neutral-500">
            <span
              className={`size-1.5 shrink-0 rounded-full ${
                SCOPE_DOT_COLORS[subject.scope] ?? "bg-gray-400"
              }`}
            />

            <span className="truncate">
              {SCOPE_LABELS[subject.scope] ?? subject.scope}
            </span>
          </span>
        </div>
      </Link>

      {/* Action Button */}
      <div className="absolute right-4 top-4 z-10 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
        <DeleteSubjectButton id={subject.id} />
      </div>
    </div>
  );
}
