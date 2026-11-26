import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { FormField } from "@/shared/ui/form-field";
import { useChangeEmailForm } from "../model/use-change-email-form";

export function ChangeEmailForm() {
  const { register, errors, handleSubmit, isDisabled, isPending } =
    useChangeEmailForm();

  return (
    <form onSubmit={handleSubmit} className="max-w-md space-y-4">
      <FormField htmlFor="change-email-address" label="Новый адрес">
        <Input
          id="change-email-address"
          type="email"
          autoComplete="email"
          disabled={isDisabled}
          aria-invalid={Boolean(errors.newEmail)}
          {...register("newEmail")}
        />
        {errors.newEmail && (
          <p className="text-sm text-destructive">{errors.newEmail.message}</p>
        )}
      </FormField>
      <FormField htmlFor="change-email-password" label="Текущий пароль">
        <Input
          id="change-email-password"
          type="password"
          autoComplete="current-password"
          disabled={isDisabled}
          aria-invalid={Boolean(errors.currentPassword)}
          {...register("currentPassword")}
        />
        {errors.currentPassword && (
          <p className="text-sm text-destructive">
            {errors.currentPassword.message}
          </p>
        )}
      </FormField>
      <Button type="submit" disabled={isDisabled || isPending}>
        {isPending ? "Меняем…" : "Изменить почту"}
      </Button>
    </form>
  );
}
