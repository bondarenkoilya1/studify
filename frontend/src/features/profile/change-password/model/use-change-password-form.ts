import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { endSession } from "@/entities/user";
import { type ChangePasswordFormData, ChangePasswordSchema } from "./schema";
import { useUpdateUserPassword } from "@/shared/api";
import { toast } from "@/shared/ui/sonner";

export function useChangePasswordForm() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const form = useForm<ChangePasswordFormData>({
    resolver: zodResolver(ChangePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
    },
  });

  const changePasswordMutation = useUpdateUserPassword({
    mutation: {
      onSuccess: async () => {
        endSession(queryClient);
        toast.success("Пароль изменён. Войдите с новым паролем.");
        await navigate({ to: "/login", replace: true });
      },
      onError: () => toast.error("Не удалось изменить пароль."),
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
