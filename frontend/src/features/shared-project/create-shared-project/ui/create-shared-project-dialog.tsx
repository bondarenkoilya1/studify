import { Controller } from "react-hook-form";

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
import { Checkbox } from "@/shared/ui/checkbox";
import { Avatar } from "@/widgets/avatar";

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

  const useProfileName = form.watch("use_profile_name");
  const useProfileAvatar = form.watch("use_profile_avatar");

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

          <FormField
            htmlFor="shared-project-url"
            label="Ссылка на проект / материалы"
          >
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

          {/* Карточка авторства: каноны UX с интерактивными опциями */}
          <div className="space-y-3.5 rounded-2xl border border-border/80 bg-muted/30 p-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Данные автора
            </div>

            {/* Опция 1: Имя профиля */}
            <div className="space-y-2">
              <label
                htmlFor="use-profile-name"
                className="flex cursor-pointer select-none items-start gap-3"
              >
                <Controller
                  control={form.control}
                  name="use_profile_name"
                  render={({ field }) => (
                    <Checkbox
                      id="use-profile-name"
                      checked={field.value}
                      onCheckedChange={(checked) =>
                        field.onChange(Boolean(checked))
                      }
                      className="mt-0.5"
                    />
                  )}
                />
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium text-foreground">
                      Использовать имя профиля
                    </span>
                    {form.profileName && (
                      <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                        {form.profileName}
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {useProfileName
                      ? "Имя автора будет автоматически взято из вашего профиля"
                      : "Вы можете указать любое другое имя или псевдоним ниже"}
                  </p>
                </div>
              </label>

              {!useProfileName && (
                <div className="pt-2 pl-8">
                  <FormField
                    htmlFor="custom-author"
                    label="Своё имя или псевдоним"
                  >
                    <Input
                      id="custom-author"
                      placeholder="Например, Иван Иванов или псевдоним"
                      controlSize="medium"
                      aria-invalid={Boolean(
                        form.formState.errors.custom_author,
                      )}
                      {...form.register("custom_author")}
                    />
                    {form.formState.errors.custom_author?.message && (
                      <p className="mt-1 text-[13px] text-red-500">
                        {form.formState.errors.custom_author.message}
                      </p>
                    )}
                  </FormField>
                </div>
              )}
            </div>

            <div className="h-px bg-border/60" />

            {/* Опция 2: Аватарка профиля */}
            <div className="space-y-2">
              <label
                htmlFor="use-profile-avatar"
                className="flex cursor-pointer select-none items-start gap-3"
              >
                <Controller
                  control={form.control}
                  name="use_profile_avatar"
                  render={({ field }) => (
                    <Checkbox
                      id="use-profile-avatar"
                      checked={field.value}
                      disabled={!form.hasProfileAvatar}
                      onCheckedChange={(checked) =>
                        field.onChange(Boolean(checked))
                      }
                      className="mt-0.5"
                    />
                  )}
                />
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium text-foreground">
                      Использовать аватарку профиля
                    </span>
                    {form.hasProfileAvatar && (
                      <Avatar
                        email={form.user?.email ?? "user"}
                        avatarUrl={form.user?.avatar_url}
                        size={22}
                      />
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {form.hasProfileAvatar
                      ? useProfileAvatar
                        ? "Текущая фотография из профиля будет прикреплена к предмету"
                        : "Аватарка профиля не будет прикреплена"
                      : "В вашем профиле ещё не установлена аватарка"}
                  </p>
                </div>
              </label>

              {!useProfileAvatar && (
                <div className="pt-2 pl-8">
                  <FormField
                    htmlFor="custom-avatar-url"
                    label="Ссылка на другую аватарку (необязательно)"
                  >
                    <Input
                      id="custom-avatar-url"
                      type="url"
                      placeholder="https://avatars.githubusercontent.com/..."
                      controlSize="medium"
                      aria-invalid={Boolean(
                        form.formState.errors.custom_avatar_url,
                      )}
                      {...form.register("custom_avatar_url")}
                    />
                    {form.formState.errors.custom_avatar_url?.message && (
                      <p className="mt-1 text-[13px] text-red-500">
                        {form.formState.errors.custom_avatar_url.message}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-muted-foreground">
                      Оставьте пустым, если не хотите прикреплять изображение
                    </p>
                  </FormField>
                </div>
              )}
            </div>
          </div>

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
