import { CalendarDays, GraduationCap } from "lucide-react";

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
    <div className="group rounded-2xl border bg-background p-6 transition-all duration-200 hover:-translate-y-1 hover:border-primary hover:shadow-lg">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} text-lg font-bold text-white shadow-sm`}
          >
            {subject.name.slice(0, 2).toUpperCase()}
          </div>

          <div>
            <h3 className="text-lg font-semibold">{subject.name}</h3>
            <p className="text-sm text-muted-foreground">Предмет</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground">
            Экзамен
          </div>

          <DeleteSubjectButton id={subject.id} />
        </div>
      </div>

      <div className="my-5 h-px bg-border" />

      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <GraduationCap className="h-4 w-4 text-muted-foreground" />

          <div>
            <p className="font-medium">{subject.lecturer}</p>
            <p className="text-xs text-muted-foreground">Преподаватель</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <CalendarDays className="h-4 w-4 text-muted-foreground" />

          <div>
            <p className="font-medium">{examDate}</p>
            <p className="text-xs text-muted-foreground">Дата экзамена</p>
          </div>
        </div>
      </div>
    </div>
  );
}
