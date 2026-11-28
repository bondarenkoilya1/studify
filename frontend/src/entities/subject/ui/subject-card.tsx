import type React from "react";
import { CalendarDays, GraduationCap, type LucideIcon } from "lucide-react";
import { Link } from "@tanstack/react-router";

import { Card } from "@/shared/ui/card";
import { ImageUpload } from "@/shared/ui/image";
import { cn } from "@/shared/lib/cn";
import { formatStudyDate } from "@/shared/lib/study-date";
import { toast } from "@/shared/ui/sonner";
import { useUploadSubjectThumbnail } from "../model/use-upload-subject-thumbnail";
import {
  LECTURER_POSITIONS,
  LECTURER_POSITION_LABELS,
  SCOPE_LABELS,
} from "@/entities/subject/model/constants";
import type { Subject } from "@/shared/api";
import {
  SCOPE_DOT_COLORS,
  getSubjectPresentation,
} from "@/entities/subject/model/presentation";
import { toAbsoluteUrl } from "@/shared/utils";

const MAX_LECTURER_ROWS = 2;

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
      <Icon className="size-[15px] shrink-0 text-muted-foreground" />
      <p className="truncate text-[13px] text-foreground">{children}</p>
    </div>
  );
}

export function SubjectCard({
  subject,
  children,
}: {
  subject: Subject;
  children?: React.ReactNode;
}) {
  const uploadThumbnail = useUploadSubjectThumbnail();

  const { gradient } = getSubjectPresentation(subject.scope, subject.id);
  const isUniversity = subject.type === "university";
  const lecturers = subject.lecturers ?? [];

  const examDate = subject.exam_date
    ? formatStudyDate(subject.exam_date, "d MMMM yyyy")
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
  const hasMeta = visibleLecturers.length > 0 || Boolean(examDate);

  const handleThumbnailSelect = (file: File) => {
    uploadThumbnail.mutate({
      id: subject.id,
      data: file,
    });
  };

  return (
    <Card className="relative h-full">
      <div className="absolute top-4 left-4 z-10">
        <ImageUpload
          src={subject.thumbnail_url}
          resolveUrl={toAbsoluteUrl}
          alt={subject.name}
          fallback={subject.name}
          shape="rounded"
          size="custom"
          maxSizeBytes={2 * 1024 * 1024}
          accept="image/png, image/jpeg, image/webp"
          loading={uploadThumbnail.isPending}
          disabled={uploadThumbnail.isPending}
          onFileSelect={handleThumbnailSelect}
          onFileReject={toast.error}
          containerClassName={cn(
            "size-11 shrink-0 rounded-[13px] shadow-sm text-[14px] font-semibold text-white",
            `bg-gradient-to-br ${gradient}`,
          )}
          className="rounded-[13px]"
        />
      </div>
      <Link
        to="/subjects/$id"
        params={{ id: subject.id }}
        className="flex h-full flex-col rounded-2xl p-4 transition-colors hover:bg-muted/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {/* Header */}
        <div className="flex min-h-11 items-center pr-10 pl-14">
          <h3
            title={subject.name}
            className="min-w-0 flex-1 line-clamp-2 text-[16px] font-semibold leading-tight tracking-[-0.01em] wrap-anywhere text-foreground"
          >
            {subject.name}
          </h3>
        </div>

        {/* Note */}
        {subject.note && (
          <p
            title={subject.note}
            className="mt-3 line-clamp-2 text-sm leading-snug wrap-anywhere text-muted-foreground"
          >
            {subject.note}
          </p>
        )}

        {/* Meta */}
        {hasMeta && (
          <div className="mt-3 space-y-2 border-t border-border pt-3">
            {visibleLecturers.map(({ pos, label, names }) => (
              <MetaRow
                key={pos}
                icon={GraduationCap}
                title={`${label}: ${names}`}
              >
                <span className="text-muted-foreground">{label}: </span>

                <span className="font-medium text-foreground">{names}</span>
              </MetaRow>
            ))}

            {hiddenCount > 0 && (
              <p className="pl-[23px] text-[12px] text-muted-foreground">
                +{hiddenCount} ещё
              </p>
            )}

            {examDate && (
              <MetaRow icon={CalendarDays} title={examDate}>
                <span className="font-medium text-foreground">{examDate}</span>
              </MetaRow>
            )}
          </div>
        )}

        <div className="mt-auto flex flex-wrap items-center gap-x-2 gap-y-1 pt-3 text-xs text-muted-foreground">
          <span>{isUniversity ? "Университетский" : "Личный"}</span>
          {subject.course && <span>{subject.course} курс</span>}
          {subject.term && <span>{subject.term} семестр</span>}
          <span className="flex min-w-0 items-center gap-1.5">
            <span
              aria-hidden="true"
              className={`size-1.5 shrink-0 rounded-full ${SCOPE_DOT_COLORS[subject.scope]}`}
            />
            {SCOPE_LABELS[subject.scope]}
          </span>
        </div>
      </Link>

      {children && (
        <div className="absolute right-3 top-4 z-10">{children}</div>
      )}
    </Card>
  );
}
