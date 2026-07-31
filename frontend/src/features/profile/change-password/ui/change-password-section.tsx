import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { useChangePasswordForm } from "../model/use-change-password-form";

export function ChangePasswordSection() {
  const { register, errors, handleSubmit, isPending, error } =
    useChangePasswordForm();

  return (
    <section>
      <div>
        <h3 className="font-medium">Password</h3>

        <p className="mt-1 text-sm text-muted-foreground">
          Change your account password.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 max-w-md space-y-4">
        <div className="space-y-2">
          <label htmlFor="oldPassword" className="text-sm font-medium">
            Current password
          </label>

          <Input
            id="oldPassword"
            type="password"
            autoComplete="current-password"
            {...register("oldPassword")}
          />

          {errors.oldPassword && (
            <p className="text-sm text-destructive">
              {errors.oldPassword.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="newPassword" className="text-sm font-medium">
            New password
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

        {error && (
          <p className="text-sm text-destructive">Failed to change password.</p>
        )}

        <Button type="submit" disabled={isPending}>
          {isPending ? "Changing..." : "Change password"}
        </Button>
      </form>
    </section>
  );
}
