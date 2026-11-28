import type { Subject } from "@/shared/api";
import { SubjectCard } from "@/entities/subject/ui/subject-card";
import { DeleteSubjectButton } from "@/features/subject/delete-subject";

interface SubjectListProps {
  subjects: Subject[];
  filtered: boolean;
}

export function SubjectList({ subjects, filtered }: SubjectListProps) {
  if (!subjects.length) {
    return (
      <div role="status" className="rounded-2xl border border-dashed p-5">
        <p className="font-medium">
          {filtered ? "Нет предметов этого типа" : "Предметов пока нет"}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {filtered
            ? "Выберите другой тип, чтобы увидеть предметы."
            : "Добавьте первый предмет, чтобы начать планировать учёбу."}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2">
      {subjects.map((subject) => (
        <SubjectCard key={subject.id} subject={subject}>
          <DeleteSubjectButton id={subject.id} subjectName={subject.name} />
        </SubjectCard>
      ))}
    </div>
  );
}
