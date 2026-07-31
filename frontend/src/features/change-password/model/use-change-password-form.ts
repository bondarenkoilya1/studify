import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import {
  type ChangePasswordFormData,
  ChangePasswordSchema,
} from "@/features/change-password/model/schema";
import { changePassword } from "@/features/change-password/api/change-password";

export function useChangePasswordForm() {
  const form = useForm<ChangePasswordFormData>({
    resolver: zodResolver(ChangePasswordSchema),
    defaultValues: {
      oldPassword: "",
      newPassword: "",
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: (values: ChangePasswordFormData) =>
      changePassword(values.oldPassword, values.newPassword),
    onSuccess: () => {
      form.reset();
      // Todo: Toast that password has been changed
    },
  });

  const onSubmit = (value: ChangePasswordFormData) => {
    changePasswordMutation.mutate(value);
  };

  return {
    register: form.register,
    errors: form.formState.errors,
    handleSubmit: form.handleSubmit(onSubmit),
    isPending: changePasswordMutation.isPending,
    error: changePasswordMutation.error,
  };
}
