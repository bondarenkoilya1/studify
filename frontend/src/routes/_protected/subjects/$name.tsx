import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { useGetTasks } from "@/entities/task";
import { TaskList } from "@/widgets/task-list";
import { useTasksMetadata } from "@/entities/task/model/use-tasks-metadata";
import { TYPE_LABELS } from "@/routes/_protected/subjects/model";
import { filterTasksByType } from "@/entities/task/model/filters";
import { CreateTaskButton } from "@/features/task/create-task";

export const Route = createFileRoute("/_protected/subjects/$name")({
  component: SubjectPage,
});

function getTaskCountLabel(count: number) {
  if (count % 10 === 1 && count % 100 !== 11) {
    return "задача";
  }

  if (
    count % 10 >= 2 &&
    count % 10 <= 4 &&
    (count % 100 < 10 || count % 100 >= 20)
  ) {
    return "задачи";
  }

  return "задач";
}

function SubjectPage() {
  const { name } = Route.useParams();
  const { data: tasks } = useGetTasks();
  const { types } = useTasksMetadata();

  const [selectedType, setSelectedType] = useState<
    "all" | (typeof types)[number]["type"]
  >("all");

  const filteredTasksByType = filterTasksByType(tasks, selectedType);
  const subjectId = tasks?.[0]?.subjectId;

  if (!subjectId) {
    return <p>Loading...</p>;
  }

  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      <main className="mx-auto max-w-[640px] px-5 py-12 sm:px-8">
        <header>
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-[30px] font-semibold tracking-[-0.02em] text-gray-900">
                {name}
              </h1>

              <p className="mt-1 text-[14px] text-gray-400">
                {filteredTasksByType?.length ?? 0}{" "}
                {getTaskCountLabel(filteredTasksByType?.length ?? 0)}
              </p>
            </div>

            <CreateTaskButton subjectId={subjectId} />
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
