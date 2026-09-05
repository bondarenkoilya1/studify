import { CalendarDays, GraduationCap } from "lucide-react";
import { Link } from "@tanstack/react-router";

import { DeleteSubjectButton } from "@/features/subject/delete-subject";
import type { Subject } from "@/entities/subject";
import {
  LECTURER_POSITIONS,
  LECTURER_POSITION_LABELS,
  SCOPE_LABELS,
} from "@/features/subject/create-subject/model/constants";
import type { LecturerPosition } from "@/entities/subject/model/types";
import {
  SCOPE_DOT_COLORS,
  SCOPE_GRADIENTS,
} from "@/entities/subject/model/presentation";

interface SubjectCardProps {
  subject: Subject;
}

const MAX_LECTURER_ROWS = 2;

function hashToIndex(id: string | number, length: number) {
  const str = String(id);
  let hash = 0;

  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }

  return Math.abs(hash) % length;
}

function MetaRow({
  icon: Icon,
  children,
  title,
}: {
  icon: typeof GraduationCap;
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

export function SubjectCard({ subject }: SubjectCardProps) {
  const scopeGradients =
    SCOPE_GRADIENTS[subject.scope] ?? SCOPE_GRADIENTS.other;

  const gradient =
    scopeGradients[hashToIndex(subject.id, scopeGradients.length)];

  const examDate = subject.examDate
    ? new Date(subject.examDate).toLocaleDateString("ru-RU", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;
  const termLabel = subject.term ? `Термин ${subject.term}` : null;

  const isUniversity = subject.type === "university";
  const scopeLabel = SCOPE_LABELS[subject.scope] ?? subject.scope;
  const scopeDotColor = SCOPE_DOT_COLORS[subject.scope] ?? "bg-gray-400";

  // Группируем лекторов по должности, сохраняя порядок из
  // LECTURER_POSITIONS (Лектор → Практика → Лабы → Ассистент), а не
  // порядок в массиве с бэкенда — так строки всегда в предсказуемом,
  // "смысловом" порядке независимо от того, как их сохранили.
  const lecturerGroups = isUniversity
    ? LECTURER_POSITIONS.map((position) => {
        const names = subject.lecturers
          .filter((lecturer) => lecturer.position === position)
          .map((lecturer) => lecturer.name)
          .filter(Boolean);

        return names.length > 0 ? { position, names: names.join(", ") } : null;
      }).filter(
        (group): group is { position: LecturerPosition; names: string } =>
          group !== null,
      )
    : [];

  const visibleGroups = lecturerGroups.slice(0, MAX_LECTURER_ROWS);
  const hiddenCount = lecturerGroups.length - visibleGroups.length;

  const hasMeta = visibleGroups.length > 0 || Boolean(examDate) || Boolean(termLabel);

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
        className="flex h-full flex-col p-6"
      >
        {/* Header */}
        <div className="flex min-h-11 items-center gap-3.5 pr-9">
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

          <div className="min-w-0 flex-1">
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
        {hasMeta && <div className="my-4 h-px bg-black/[0.04]" />}

        {/* Meta */}
        <div className="space-y-2.5">
          {visibleGroups.map(({ position, names }) => (
            <MetaRow
              key={position}
              icon={GraduationCap}
              title={`${LECTURER_POSITION_LABELS[position]}: ${names}`}
            >
              <span className="text-neutral-400">
                {LECTURER_POSITION_LABELS[position]}:{" "}
              </span>
              <span className="font-medium text-neutral-700">{names}</span>
            </MetaRow>
          ))}

          {hiddenCount > 0 && (
            <p className="pl-[23px] text-[12px] text-neutral-400">
              +{hiddenCount} {hiddenCount === 1 ? "должность" : "должности"}
            </p>
          )}

          {termLabel && (
            <MetaRow icon={CalendarDays} title={termLabel}>
              <span className="font-medium text-neutral-700">{termLabel}</span>
            </MetaRow>
          )}

          {examDate && (
            <MetaRow icon={CalendarDays} title={examDate}>
              <span className="font-medium text-neutral-700">{examDate}</span>
            </MetaRow>
          )}
        </div>

        {/*
          Bottom metadata — прижат через mt-auto в flex-column вместо
          absolute-позиционирования: гарантированно не наедет на meta
          выше, сколько бы строк лекторов ни было (это и есть причина,
          почему выше введён MAX_LECTURER_ROWS — без капа meta мог бы
          вытолкнуть контент за пределы фиксированной высоты карточки,
          mt-auto защищает только от наложения, но не от переполнения
          самой карточки).
        */}
        <div className="mt-auto flex items-center gap-2 pt-4">
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

          {termLabel && (
            <span className="rounded-full bg-violet-50 px-2.5 py-1 text-[11px] font-medium text-violet-700">
              {termLabel}
            </span>
          )}

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
          group-focus-within:opacity-100
        "
      >
        <DeleteSubjectButton id={subject.id} />
      </div>
    </div>
  );
}
