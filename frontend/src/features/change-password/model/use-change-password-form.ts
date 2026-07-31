import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import {
  type ChangePasswordFormData,
  ChangePasswordSchema,
} from "@/features/change-password/model/schema";
import { changePassword } from "@/features/change-password/api/change-password";
import { toast } from "react-toastify";

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
      toast.success("Your password was successfully updated!");
    },
    onError: () => toast.error("Failed to update password."),
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
