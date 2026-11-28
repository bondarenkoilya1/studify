import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";

import {
  getGetUserSubjectsQueryOptions,
  useGetUserSubjectsSuspense,
} from "@/shared/api";
import { Button } from "@/shared/ui/button";
import { SubjectList } from "@/widgets/subjects-list";
import { CreateSubjectDialog } from "@/features/subject/create-subject/ui/create-subject-dialog";

type SubjectFilter = "all" | "university" | "personal";

const FILTER_LABELS: Record<Exclude<SubjectFilter, "all">, string> = {
  university: "Университетские",
  personal: "Личные",
};

export const Route = createFileRoute("/_protected/subjects/")({
  loader: ({ context: { queryClient } }) =>
    queryClient.ensureQueryData(getGetUserSubjectsQueryOptions()),
  component: SubjectsPage,
});

function SubjectsPage() {
  const { data } = useGetUserSubjectsSuspense();

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

  return (
    <section className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
      <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <h1 className="text-3xl font-semibold tracking-tight">Предметы</h1>

        <Button onClick={() => setIsCreateSubjectOpen(true)}>
          Добавить предмет
        </Button>
      </header>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setSelectedType("all")}
          aria-pressed={selectedType === "all"}
          className={`
            min-h-10 cursor-pointer rounded-full px-3.5
            text-xs font-medium
            transition-all duration-200
            ${
              selectedType === "all"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-card text-muted-foreground shadow-xs hover:bg-muted hover:text-foreground"
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
            aria-pressed={selectedType === type}
            className={`
              min-h-10 cursor-pointer rounded-full px-3.5
              text-xs font-medium
              transition-all duration-200
              ${
                selectedType === type
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-card text-muted-foreground shadow-xs hover:bg-muted hover:text-foreground"
              }
            `}
          >
            {FILTER_LABELS[type]}
            <span className="ml-1.5 opacity-60">{counts[type]}</span>
          </button>
        ))}
      </div>

      <SubjectList subjects={filteredSubjects} filtered={data.length > 0} />

      <CreateSubjectDialog
        open={isCreateSubjectOpen}
        onOpenChange={setIsCreateSubjectOpen}
      />
    </section>
  );
}
