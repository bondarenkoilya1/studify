import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { Button } from "@/shared/ui/button";
import { FormField } from "@/shared/ui/form-field";
import { Input } from "@/shared/ui/input";

import { useCreateSharedProjectForm } from "../model/use-create-shared-project-form";

export type CreateSharedProjectDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CreateSharedProjectDialog({
  open,
  onOpenChange,
}: CreateSharedProjectDialogProps) {
  const form = useCreateSharedProjectForm(() => {
    onOpenChange(false);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogClose onClick={() => onOpenChange(false)} />

      <DialogHeader>
        <DialogTitle>Создать общий предмет</DialogTitle>
        <DialogDescription>
          Поделитесь учебным материалом, конспектами или полезным проектом.
        </DialogDescription>
      </DialogHeader>

      <DialogBody>
        <form onSubmit={form.submit} className="space-y-4">
          {form.formState.errors.root?.message && (
            <div className="rounded-xl bg-red-500/10 px-3.5 py-2.5 text-[13px] text-red-600">
              {form.formState.errors.root.message}
            </div>
          )}

          <FormField htmlFor="shared-project-name" label="Название">
            <Input
              id="shared-project-name"
              placeholder="Например, «Конспекты по алгоритмам»"
              controlSize="large"
              aria-invalid={Boolean(form.formState.errors.name)}
              {...form.register("name")}
            />
            {form.formState.errors.name?.message && (
              <p className="mt-1 text-[13px] text-red-500">
                {form.formState.errors.name.message}
              </p>
            )}
          </FormField>

          <FormField htmlFor="shared-project-url" label="Ссылка на проект / материалы">
            <Input
              id="shared-project-url"
              type="url"
              placeholder="https://github.com/..."
              controlSize="large"
              aria-invalid={Boolean(form.formState.errors.url)}
              {...form.register("url")}
            />
            {form.formState.errors.url?.message && (
              <p className="mt-1 text-[13px] text-red-500">
                {form.formState.errors.url.message}
              </p>
            )}
          </FormField>

          <FormField htmlFor="shared-project-author" label="Автор">
            <Input
              id="shared-project-author"
              placeholder="Ваше имя или псевдоним"
              controlSize="large"
              aria-invalid={Boolean(form.formState.errors.author)}
              {...form.register("author")}
            />
            {form.formState.errors.author?.message && (
              <p className="mt-1 text-[13px] text-red-500">
                {form.formState.errors.author.message}
              </p>
            )}
          </FormField>

          <FormField
            htmlFor="shared-project-avatar"
            label="Ссылка на аватарку автора (опционально)"
          >
            <Input
              id="shared-project-avatar"
              type="url"
              placeholder="https://avatars.githubusercontent.com/..."
              controlSize="large"
              aria-invalid={Boolean(form.formState.errors.author_avatar_url)}
              {...form.register("author_avatar_url")}
            />
            {form.formState.errors.author_avatar_url?.message && (
              <p className="mt-1 text-[13px] text-red-500">
                {form.formState.errors.author_avatar_url.message}
              </p>
            )}
          </FormField>

          <DialogFooter>
            <Button
              type="submit"
              size="lg"
              disabled={form.isPending}
              className="w-full cursor-pointer"
            >
              {form.isPending ? "Создаём..." : "Создать общий предмет"}
            </Button>
          </DialogFooter>
        </form>
      </DialogBody>
    </Dialog>
  );
}
