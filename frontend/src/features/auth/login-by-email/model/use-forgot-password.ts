import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { forgotPassword } from "@/features/auth/login-by-email/api/forgot-password";

import {
  forgotPasswordSchema,
  type ForgotPasswordFormValues,
} from "../model/forgot-password.schema";

export function useForgotPassword() {
  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const submit = form.handleSubmit(async (values) => {
    await forgotPassword(values.email);
  });

  return {
    ...form,
    submit,
    isSubmitting: form.formState.isSubmitting,
  };
}
