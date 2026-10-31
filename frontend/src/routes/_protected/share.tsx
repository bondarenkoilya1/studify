import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ExternalLink, Plus, Share2 } from "lucide-react";

import { useGetUserSharedProjects } from "@/shared/api";
import { Button } from "@/shared/ui/button";
import { Avatar } from "@/widgets/avatar";
import {
  CreateSharedProjectDialog,
  DeleteSharedProjectButton,
} from "@/features/shared-project";

export const Route = createFileRoute("/_protected/share")({
  component: SharePage,
});

function SharePage() {
  const { data: projects = [], isPending, error } = useGetUserSharedProjects();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  if (isPending) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground">
        Загрузка...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-64 items-center justify-center text-destructive">
        Не удалось загрузить общие предметы. Попробуйте обновить страницу.
      </div>
    );
  }

  return (
    <section className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-8">
      <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Общие предметы</h1>
          <p className="mt-2 text-muted-foreground">
            Делитесь полезными учебными материалами, конспектами и проектами.
          </p>
        </div>

        <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
          <Plus className="size-4" />
          <span>Создать общий предмет</span>
        </Button>
      </header>

      {projects.length === 0 ? (
        <div className="flex min-h-[320px] flex-col items-center justify-center rounded-2xl border border-dashed border-border p-8 text-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Share2 className="size-7" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-foreground">
            У вас пока нет общих предметов
          </h3>
          <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
            Создайте свой первый общий предмет, чтобы поделиться им с другими
            студентами.
          </p>
          <Button
            className="mt-6 gap-2"
            onClick={() => setIsCreateOpen(true)}
          >
            <Plus className="size-4" />
            <span>Создать общий предмет</span>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <article
              key={project.id}
              className="group relative flex flex-col justify-between rounded-2xl border border-border bg-card p-6 shadow-sm transition-all hover:border-primary/40 hover:shadow-md"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <h3 className="line-clamp-2 text-lg font-semibold tracking-tight text-foreground">
                    {project.name}
                  </h3>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <div className="opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100">
                      <DeleteSharedProjectButton id={project.id} />
                    </div>
                    <a
                      href={project.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      title="Открыть ссылку"
                    >
                      <ExternalLink className="size-4" />
                    </a>
                  </div>
                </div>

                <p className="mt-2 line-clamp-1 break-all text-xs text-muted-foreground">
                  {project.url}
                </p>
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-border/60 pt-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Avatar
                    email={project.author}
                    avatarUrl={project.author_avatar_url}
                    size={24}
                  />
                  <span className="font-medium text-foreground">
                    {project.author}
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <CreateSharedProjectDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
      />
    </section>
  );
}
