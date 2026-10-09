import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { FileText, File as FileIcon, Search, ArrowLeft } from "lucide-react";

import { TaskList } from "@/widgets/task-list";
import {
  getTaskCountLabel,
  TYPE_LABELS,
} from "@/entities/task/model/presentation";
import {
  filterTasksByType,
  type TaskTypeFilter,
} from "@/entities/task/model/filters";
import { getTaskTypeCounts } from "@/entities/task/model/task-type-counts";
import { CreateTaskButton } from "@/features/task/create-task";
import {
  ApiError,
  getGetSubjectQueryOptions,
  getGetSubjectTasksQueryOptions,
  type SubjectFile,
  useGetSubjectSuspense,
  useGetSubjectTasksSuspense,
} from "@/shared/api";
import { formatBytes, toAbsoluteUrl } from "@/shared/utils";

export const Route = createFileRoute("/_protected/subjects/$id")({
  params: {
    parse: (params) => {
      const id = Number(params.id);

      if (!Number.isInteger(id) || id <= 0) {
        throw notFound();
      }

      return { id };
    },
    stringify: ({ id }) => ({ id: String(id) }),
  },
  loader: async ({ context: { queryClient }, params: { id } }) => {
    try {
      await Promise.all([
        queryClient.ensureQueryData(getGetSubjectQueryOptions(id)),
        queryClient.ensureQueryData(getGetSubjectTasksQueryOptions(id)),
      ]);
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        throw notFound();
      }

      throw error;
    }
  },
  component: SubjectPage,
});

function SubjectFilesSidebar({ files }: { files: SubjectFile[] }) {
  if (!files || files.length === 0) {
    return null;
  }

  return (
    <aside className="w-full shrink-0 lg:w-[320px]">
      <div className="rounded-[20px] border border-gray-100 bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
        <h2 className="text-[17px] font-semibold tracking-tight text-gray-900">
          Материалы курса
        </h2>

        <div className="mt-4 flex flex-col gap-2">
          {files.map((file) => {
            const formattedSize = formatBytes(file.size_bytes);
            const url = toAbsoluteUrl(file.url);

            const isText =
              file.content_type.startsWith("text/plain") ||
              file.name.toLowerCase().endsWith(".txt");

            const iconWrapperClass = isText
              ? "bg-blue-50 text-blue-500 group-hover:bg-blue-100"
              : "bg-red-50 text-red-500 group-hover:bg-red-100";

            const label = isText ? "TXT" : "PDF";
            const IconComponent = isText ? FileText : FileIcon;

            return (
              <a
                key={file.url}
                href={url}
                target="_blank"
                rel="noreferrer"
                className="group flex cursor-pointer items-center gap-3 rounded-2xl border border-transparent p-3 transition-all duration-200 hover:border-gray-100 hover:bg-gray-50"
              >
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-colors ${iconWrapperClass}`}
                >
                  <IconComponent strokeWidth={1.5} size={22} />
                </div>

                <div className="flex min-w-0 flex-1 flex-col justify-center">
                  <p className="truncate text-[14px] font-medium leading-tight text-gray-900">
                    {file.name}
                  </p>

                  <div className="mt-1 flex items-center gap-1.5">
                    <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                      {label}
                    </span>

                    <span className="text-[12px] text-gray-400">
                      {formattedSize}
                    </span>
                  </div>
                </div>

                <div className="text-gray-300 opacity-0 transition-all duration-200 group-hover:text-gray-500 group-hover:opacity-100">
                  <Search size={18} strokeWidth={2} />
                </div>
              </a>
            );
          })}
        </div>
      </div>
    </aside>
  );
}

function SubjectPage() {
  const { id } = Route.useParams();

  const { data: subject } = useGetSubjectSuspense(id);
  const { data: tasks } = useGetSubjectTasksSuspense(id);

  const [selectedType, setSelectedType] = useState<TaskTypeFilter>("all");

  const types = getTaskTypeCounts(tasks);
  const filteredTasksByType = filterTasksByType(tasks, selectedType);

  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      <div className="mx-auto flex max-w-[1024px] flex-col gap-8 px-5 py-12 sm:px-8 lg:flex-row">
        <main className="w-full max-w-[640px] flex-1">
          <Link
            to="/subjects"
            className="
              group mb-6 inline-flex items-center gap-1.5
              rounded-full bg-white py-1.5 pl-2.5 pr-3.5
              text-[13px] font-medium text-gray-500
              shadow-[0_1px_2px_rgba(0,0,0,0.04)]
              transition-all duration-200
              hover:bg-gray-50 hover:text-gray-900
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900/20
            "
          >
            <ArrowLeft
              size={16}
              strokeWidth={2}
              className="transition-transform duration-200 group-hover:-translate-x-0.5"
            />
            Предметы
          </Link>

          <header>
            <div className="flex items-center justify-between gap-4">
              <div>
                <h1 className="text-[30px] font-semibold tracking-[-0.02em] text-gray-900">
                  {subject.name}
                </h1>

                <p className="mt-1 text-[14px] text-gray-400">
                  {filteredTasksByType.length}{" "}
                  {getTaskCountLabel(filteredTasksByType.length)}
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

          <div className="mt-8">
            <TaskList tasks={filteredTasksByType} />
          </div>
        </main>

        <SubjectFilesSidebar files={subject.files ?? []} />
      </div>
    </div>
  );
}
