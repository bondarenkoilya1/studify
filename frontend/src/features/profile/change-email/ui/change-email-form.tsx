import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { FormError, FormField } from "@/shared/ui/form-field";
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
          aria-describedby={
            errors.newEmail ? "change-email-address-error" : undefined
          }
          {...register("newEmail")}
        />
        {errors.newEmail && (
          <FormError id="change-email-address-error">
            {errors.newEmail.message}
          </FormError>
        )}
      </FormField>
      <FormField htmlFor="change-email-password" label="Текущий пароль">
        <Input
          id="change-email-password"
          type="password"
          autoComplete="current-password"
          disabled={isDisabled}
          aria-invalid={Boolean(errors.currentPassword)}
          aria-describedby={
            errors.currentPassword ? "change-email-password-error" : undefined
          }
          {...register("currentPassword")}
        />
        {errors.currentPassword && (
          <FormError id="change-email-password-error">
            {errors.currentPassword.message}
          </FormError>
        )}
      </FormField>
      <Button type="submit" disabled={isDisabled || isPending}>
        {isPending ? "Меняем…" : "Изменить почту"}
      </Button>
    </form>
  );
}
