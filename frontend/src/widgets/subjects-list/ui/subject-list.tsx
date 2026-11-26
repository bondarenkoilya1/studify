import type { Subject } from "@/shared/api";
import { SubjectCard } from "@/entities/subject/ui/subject-card";
import { DeleteSubjectButton } from "@/features/subject/delete-subject";

interface SubjectListProps {
  subjects: Subject[];
}

export function SubjectList({ subjects }: SubjectListProps) {
  if (!subjects.length) {
    return (
      <div className="flex min-h-80 flex-col items-center justify-center rounded-2xl border border-dashed bg-muted/20 p-8 text-center">
        <h3 className="text-lg font-semibold">У вас пока нет предметов</h3>

        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          Добавьте первый предмет, чтобы начать планировать учёбу.
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
