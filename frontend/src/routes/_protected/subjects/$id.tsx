import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { useGetTasks } from "@/entities/task";
import { TaskList } from "@/widgets/task-list";
import { useTasksMetadata } from "@/entities/task/model/use-tasks-metadata";
import {
  getTaskCountLabel,
  TYPE_LABELS,
} from "@/widgets/task-list/model/model";
import { filterTasksByType } from "@/entities/task/model/filters";
import { CreateTaskButton } from "@/features/task/create-task";
import { useGetSubject } from "@/entities/subject";

export const Route = createFileRoute("/_protected/subjects/$id")({
  parseParams: (params) => ({
    id: Number(params.id),
  }),
  component: SubjectPage,
});

function SubjectPage() {
  const { id } = Route.useParams();
  const { data: tasks } = useGetTasks(id);
  const { types } = useTasksMetadata(id);
  const subject = useGetSubject(id);

  const [selectedType, setSelectedType] = useState<
    "all" | (typeof types)[number]["type"]
  >("all");

  const filteredTasksByType = filterTasksByType(tasks, selectedType);

  if (!id || !subject) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      <main className="mx-auto max-w-[640px] px-5 py-12 sm:px-8">
        <header>
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-[30px] font-semibold tracking-[-0.02em] text-gray-900">
                {subject?.name}
              </h1>

              <p className="mt-1 text-[14px] text-gray-400">
                {filteredTasksByType?.length ?? 0}{" "}
                {getTaskCountLabel(filteredTasksByType?.length ?? 0)}
              </p>
            </div>

            <CreateTaskButton subjectId={id} />
          </div>

          {types.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2">
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
              </button>

              {types.map(({ type, count }) => (
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
                  {TYPE_LABELS[type]}
                  <span className="ml-1.5 opacity-60">{count}</span>
                </button>
              ))}
            </div>
          )}
        </header>

        <TaskList tasks={filteredTasksByType} />
      </main>
    </div>
  );
}
