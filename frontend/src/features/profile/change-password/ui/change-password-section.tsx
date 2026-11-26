import { Card } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { useChangePasswordForm } from "../model/use-change-password-form";

export function ChangePasswordSection() {
  const { register, errors, handleSubmit, isPending } = useChangePasswordForm();

  return (
    <Card className="rounded-xl p-5">
      <div>
        <h3 className="font-medium">Пароль</h3>

        <p className="mt-1 text-sm text-muted-foreground">
          После смены пароля сессии завершатся на всех устройствах.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 max-w-md space-y-4">
        <div className="space-y-2">
          <label htmlFor="currentPassword" className="text-sm font-medium">
            Текущий пароль
          </label>

          <Input
            id="currentPassword"
            type="password"
            autoComplete="current-password"
            {...register("currentPassword")}
          />

          {errors.currentPassword && (
            <p className="text-sm text-destructive">
              {errors.currentPassword.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="newPassword" className="text-sm font-medium">
            Новый пароль
          </label>

          <Input
            id="newPassword"
            type="password"
            autoComplete="new-password"
            {...register("newPassword")}
          />

          {errors.newPassword && (
            <p className="text-sm text-destructive">
              {errors.newPassword.message}
            </p>
          )}
        </div>

        {errors.root?.message && (
          <p role="alert" className="text-sm text-destructive">
            {errors.root.message}
          </p>
        )}

        <Button type="submit" disabled={isPending}>
          {isPending ? "Меняем…" : "Изменить пароль"}
        </Button>
      </form>
    </Card>
  );
}
