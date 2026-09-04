// features/auth/login-by-email/model/use-reset-password.ts
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  resetPasswordSchema,
  type ResetPasswordFormValues,
} from "./reset-password.schema";
import { resetPassword } from "../../api/reset-password/reset-password";

export function useResetPassword(token: string) {
  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      new_password: "",
      new_password_confirmed: "",
    },
  });

  const submit = form.handleSubmit((values) =>
    resetPassword({
      passwordResetToken: token,
      newPassword: values.new_password,
      newPasswordConfirmed: values.new_password_confirmed,
    }),
  );

  return {
    ...form,
    submit,
    isSubmitting: form.formState.isSubmitting,
  };
}
