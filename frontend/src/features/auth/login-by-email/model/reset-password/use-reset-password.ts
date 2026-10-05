import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "@/shared/ui/sonner";
import {
  resetPasswordSchema,
  type ResetPasswordFormValues,
} from "./reset-password.schema";
import { resetPassword } from "../../api/reset-password/reset-password";

export function useResetPassword(token: string, onSuccess?: () => void) {
  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      new_password: "",
      new_password_confirmed: "",
    },
  });

  // handleSubmit swallows errors thrown here, so the result is handled inside.
  const submit = form.handleSubmit(async (values) => {
    try {
      await resetPassword({
        passwordResetToken: token,
        newPassword: values.new_password,
        newPasswordConfirmed: values.new_password_confirmed,
      });
      onSuccess?.();
    } catch {
      toast.error("Не удалось сменить пароль");
    }
  });

  return {
    ...form,
    submit,
    isSubmitting: form.formState.isSubmitting,
  };
}
