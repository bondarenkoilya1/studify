import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { forgotPassword } from "../../api/reset-password/forgot-password";
import {
  type ForgotPasswordFormValues,
  forgotPasswordSchema,
} from "./forgot-password.schema";

export function useForgotPassword() {
  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const submit = form.handleSubmit((values) => forgotPassword(values.email));

  return {
    ...form,
    submit,
    isSubmitting: form.formState.isSubmitting,
  };
}
