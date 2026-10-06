import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { type ChangePasswordFormData, ChangePasswordSchema } from "./schema";
import { useUpdateUserPassword } from "@/shared/api";
import { toast } from "@/shared/ui/sonner";

export function useChangePasswordForm() {
  const form = useForm<ChangePasswordFormData>({
    resolver: zodResolver(ChangePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
    },
  });

  const changePasswordMutation = useUpdateUserPassword({
    mutation: {
      onSuccess: () => {
        form.reset();
        toast.success("Your password was successfully updated!");
      },
      onError: () => toast.error("Failed to update password."),
    },
  });

  const onSubmit = (value: ChangePasswordFormData) => {
    changePasswordMutation.mutate({
      data: {
        current_password: value.currentPassword,
        new_password: value.newPassword,
      },
    });
  };

  return {
    register: form.register,
    errors: form.formState.errors,
    handleSubmit: form.handleSubmit(onSubmit),
    isPending: changePasswordMutation.isPending,
    error: changePasswordMutation.error,
  };
}
