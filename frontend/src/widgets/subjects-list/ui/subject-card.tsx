import { CalendarDays, GraduationCap } from "lucide-react";
import { Link } from "@tanstack/react-router";

import { DeleteSubjectButton } from "@/features/subjects/delete-subject";
import type { Subject } from "@/entities/subject";

interface SubjectCardProps {
  subject: Subject;
}

const gradients = [
  "from-violet-500 to-indigo-600",
  "from-blue-500 to-cyan-500",
  "from-emerald-500 to-teal-500",
  "from-orange-500 to-red-500",
  "from-pink-500 to-rose-500",
];

export function SubjectCard({ subject }: SubjectCardProps) {
  const examDate = new Date(subject.examDate).toLocaleDateString(undefined, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const gradient = gradients[subject.id % gradients.length];

  return (
    <div className="group relative h-[280px] overflow-hidden rounded-2xl border bg-background transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg">
      <Link
        to="/subjects/$id"
        params={{ id: String(subject.id) }}
        className="block h-full p-6"
      >
        {/* Header */}
        <div className="flex items-start gap-4 pr-10">
          <div
            className={`flex size-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} text-lg font-bold text-white shadow-sm`}
          >
            {subject.name.slice(0, 2).toUpperCase()}
          </div>

          <div className="min-w-0 flex-1">
            <h3
              title={subject.name}
              className="line-clamp-2 text-lg font-semibold leading-tight tracking-tight"
            >
              {subject.name}
            </h3>

            <p className="mt-1 text-sm text-muted-foreground">Предмет</p>
          </div>
        </div>

        {/* Meta */}
        <div className="mt-8 space-y-5">
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

          <div className="flex items-center gap-3">
            <CalendarDays className="size-4 shrink-0 text-muted-foreground" />

            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{examDate}</p>
              <p className="text-xs text-muted-foreground">Дата экзамена</p>
            </div>
          </div>
        </div>

        {/* Type */}
        <div className="absolute bottom-6 left-6">
          <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
            Экзамен
          </span>
        </div>
      </Link>

      {/* Delete */}
      <div className="absolute right-6 top-6">
        <DeleteSubjectButton id={subject.id} />
      </div>
    </div>
  );
}
