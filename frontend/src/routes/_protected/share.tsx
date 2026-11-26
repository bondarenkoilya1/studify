import { createFileRoute } from "@tanstack/react-router";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { ExternalLink, Pencil, Plus } from "lucide-react";
import {
  getGetSharedProjectCatalogQueryKey,
  getGetUserSharedProjectsQueryOptions,
  getSharedProjectCatalog,
  type SharedProject,
  useGetUserSharedProjectsSuspense,
} from "@/shared/api";
import { getRequestErrorMessage } from "@/shared/api/request-error-message";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { Avatar } from "@/widgets/avatar";
import {
  CreateSharedProjectDialog,
  DeleteSharedProjectButton,
} from "@/features/shared-project";

export const Route = createFileRoute("/_protected/share")({
  loader: ({ context: { queryClient } }) =>
    queryClient.ensureQueryData(getGetUserSharedProjectsQueryOptions()),
  component: SharePage,
});

function ProjectCards({
  projects,
  onEdit,
}: {
  projects: SharedProject[];
  onEdit?: (project: SharedProject) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {projects.map((project) => (
        <Card
          key={project.id}
          className="flex flex-col justify-between gap-4 p-5"
        >
          <div>
            <div className="flex items-start justify-between gap-3">
              <h2 className="min-w-0 break-words text-lg font-semibold text-foreground">
                {project.name}
              </h2>
              <div className="flex shrink-0 items-center gap-1">
                {onEdit && (
                  <>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-11"
                      aria-label={`Редактировать «${project.name}»`}
                      onClick={() => onEdit(project)}
                    >
                      <Pencil />
                    </Button>
                    <DeleteSharedProjectButton
                      id={project.id}
                      projectName={project.name}
                    />
                  </>
                )}
                <a
                  href={project.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Открыть ссылку «${project.name}»`}
                  className="inline-flex size-11 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted"
                >
                  <ExternalLink className="size-4" />
                </a>
              </div>
            </div>
            <p className="mt-2 truncate text-xs text-muted-foreground">
              {project.url}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3 text-xs text-muted-foreground">
            <span className="flex min-w-0 items-center gap-2">
              <Avatar
                email={project.author}
                avatarUrl={project.author_avatar_url}
                size={24}
              />
              <span className="truncate">{project.author}</span>
            </span>
            {onEdit && (
              <span>{project.is_public ? "В каталоге" : "Только вам"}</span>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}

function SharePage() {
  const { data: ownProjects } = useGetUserSharedProjectsSuspense();
  const [ownView, setOwnView] = useState(false);
  const [editor, setEditor] = useState<SharedProject | "new" | null>(null);
  const catalog = useInfiniteQuery({
    queryKey: getGetSharedProjectCatalogQueryKey(),
    queryFn: ({ pageParam, signal }) =>
      getSharedProjectCatalog(
        pageParam === undefined ? undefined : { before: pageParam },
        { signal },
      ),
    initialPageParam: undefined as number | undefined,
    getNextPageParam: (page) => page.next_before ?? undefined,
    enabled: !ownView,
  });
  const publishedProjects = useMemo(
    () => catalog.data?.pages.flatMap((page) => page.items) ?? [],
    [catalog.data],
  );
  const projects = ownView ? ownProjects : publishedProjects;

  return (
    <section className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-4xl font-bold tracking-tight">Общие предметы</h1>
        <Button onClick={() => setEditor("new")}>
          <Plus /> Создать общий предмет
        </Button>
      </header>

      <div
        role="group"
        aria-label="Список общих предметов"
        className="flex flex-wrap gap-2"
      >
        <Button
          type="button"
          variant={ownView ? "outline" : "default"}
          aria-pressed={!ownView}
          onClick={() => setOwnView(false)}
        >
          Каталог
        </Button>
        <Button
          type="button"
          variant={ownView ? "default" : "outline"}
          aria-pressed={ownView}
          onClick={() => setOwnView(true)}
        >
          Мои предметы
        </Button>
      </div>

      {!ownView && catalog.isPending ? (
        <p role="status" className="text-muted-foreground">
          Загружаем каталог…
        </p>
      ) : !ownView && catalog.isError && !catalog.data ? (
        <div role="alert" className="space-y-2">
          <p>
            {getRequestErrorMessage(
              catalog.error,
              "Не удалось загрузить каталог.",
            )}
          </p>
          <Button variant="outline" onClick={() => void catalog.refetch()}>
            Повторить
          </Button>
        </div>
      ) : projects.length ? (
        <ProjectCards
          projects={projects}
          onEdit={ownView ? setEditor : undefined}
        />
      ) : (
        <p className="rounded-2xl border border-dashed border-border p-8 text-center text-muted-foreground">
          {ownView
            ? "У вас пока нет общих предметов."
            : "В каталоге пока нет опубликованных предметов."}
        </p>
      )}

      {!ownView && catalog.hasNextPage && (
        <div className="space-y-2 self-center text-center">
          {catalog.isFetchNextPageError && (
            <p role="alert">Не удалось загрузить следующую страницу.</p>
          )}
          <Button
            variant="outline"
            disabled={catalog.isFetchingNextPage}
            onClick={() => void catalog.fetchNextPage()}
          >
            {catalog.isFetchingNextPage ? "Загружаем…" : "Показать ещё"}
          </Button>
        </div>
      )}

      {editor && (
        <CreateSharedProjectDialog
          open
          project={editor === "new" ? undefined : editor}
          onOpenChange={(open) => {
            if (!open) setEditor(null);
          }}
          onSaved={() => setOwnView(true)}
        />
      )}
    </section>
  );
}
