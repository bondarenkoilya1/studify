import { createFileRoute } from "@tanstack/react-router";
import { SubjectList } from "@/entities/subject";
import { useGetSubjects } from "@/entities/subject/model/useGetSubjects";
import { Button } from "@/shared/ui/button";

export const Route = createFileRoute("/_protected/subjects")({
  component: SubjectsPage,
});

export function SubjectsPage() {
  const { data = [], isPending, error } = useGetSubjects();

  if (isPending) {
    return (
      <div className="flex h-64 items-center justify-center">Загрузка...</div>
    );
  }

  if (error) {
    return (
      <div className="flex h-64 items-center justify-center text-destructive">
        Не удалось загрузить предметы. Попробуйте обновить страницу.
      </div>
    );
  }

  return (
    <section className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Предметы</h1>

          <p className="mt-2 text-muted-foreground">
            Управляйте предметами и следите за датами экзаменов.
          </p>
        </div>

        <Button>Добавить предмет</Button>
      </header>

      <SubjectList subjects={data} />
    </section>
  );
}
