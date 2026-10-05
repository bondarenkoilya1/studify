import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "@/shared/ui/sonner";
import { forgotPassword } from "../../api/reset-password/forgot-password";
import {
  type ForgotPasswordFormValues,
  forgotPasswordSchema,
} from "./forgot-password.schema";

export function useForgotPassword(onSuccess?: () => void) {
  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  // handleSubmit swallows errors thrown here, so the result is handled inside.
  const submit = form.handleSubmit(async (values) => {
    try {
      await forgotPassword(values.email);
      toast.success("Ссылка для сброса пароля отправлена на вашу почту");
      onSuccess?.();
    } catch {
      toast.error("Не удалось отправить ссылку");
    }
  });

  return {
    ...form,
    submit,
    isSubmitting: form.formState.isSubmitting,
  };
}
