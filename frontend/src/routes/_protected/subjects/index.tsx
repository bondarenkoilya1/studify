import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";

import { useGetSubjects } from "@/entities/subject/model/useGetSubjects";
import { Button } from "@/shared/ui/button";
import { SubjectList } from "@/widgets/subjects-list";
import { CreateSubjectDialog } from "@/features/subjects/create-subject/ui/create-subject-dialog";

type SubjectFilter = "all" | "university" | "personal";

const FILTER_LABELS: Record<Exclude<SubjectFilter, "all">, string> = {
  university: "Университетские",
  personal: "Личные",
};

export const Route = createFileRoute("/_protected/subjects/")({
  component: SubjectsPage,
});

export function SubjectsPage() {
  const { data = [], isPending, error } = useGetSubjects();

  const [isCreateSubjectOpen, setIsCreateSubjectOpen] = useState(false);

  const [selectedType, setSelectedType] = useState<SubjectFilter>("all");

  const filteredSubjects = useMemo(() => {
    if (selectedType === "all") {
      return data;
    }

    return data.filter((subject) => subject.type === selectedType);
  }, [data, selectedType]);

  const counts = useMemo(
    () => ({
      university: data.filter((subject) => subject.type === "university")
        .length,
      personal: data.filter((subject) => subject.type === "personal").length,
    }),
    [data],
  );

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
      <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Предметы</h1>

          <p className="mt-2 text-muted-foreground">
            Управляйте предметами и следите за датами экзаменов.
          </p>
        </div>

        <Button onClick={() => setIsCreateSubjectOpen(true)}>
          Добавить предмет
        </Button>
      </header>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setSelectedType("all")}
          className={`
            rounded-full px-3.5 py-1.5
            text-[12.5px] font-medium
            transition-all duration-200
            ${
              selectedType === "all"
                ? "bg-gray-900 text-white shadow-sm"
                : "bg-white text-gray-500 shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:bg-gray-50 hover:text-gray-700"
            }
          `}
        >
          Все
          <span className="ml-1.5 opacity-60">{data.length}</span>
        </button>

        {(["university", "personal"] as const).map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => setSelectedType(type)}
            className={`
              rounded-full px-3.5 py-1.5
              text-[12.5px] font-medium
              transition-all duration-200
              ${
                selectedType === type
                  ? "bg-gray-900 text-white shadow-sm"
                  : "bg-white text-gray-500 shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:bg-gray-50 hover:text-gray-700"
              }
            `}
          >
            {FILTER_LABELS[type]}
            <span className="ml-1.5 opacity-60">{counts[type]}</span>
          </button>
        ))}
      </div>

      <SubjectList subjects={filteredSubjects} />

      <CreateSubjectDialog
        open={isCreateSubjectOpen}
        onOpenChange={setIsCreateSubjectOpen}
      />
    </section>
  );
}
