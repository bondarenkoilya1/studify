import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { currentUserQuery, useCurrentUser } from "@/entities/user";
import { useUpdateUserEmail } from "@/shared/api";
import { getRequestErrorMessage } from "@/shared/api/request-error-message";
import { toast } from "@/shared/ui/sonner";
import { ChangeEmailSchema, type ChangeEmailFormData } from "./schema";

export function useChangeEmailForm() {
  const { data } = useCurrentUser();
  const queryClient = useQueryClient();

  const form = useForm<ChangeEmailFormData>({
    resolver: zodResolver(ChangeEmailSchema),
    defaultValues: {
      newEmail: "",
      currentPassword: "",
    },
  });

  const changeEmailMutation = useUpdateUserEmail({
    mutation: {
      onSuccess: async (user) => {
        form.reset();
        queryClient.setQueryData(currentUserQuery.queryKey, user);
        await queryClient.invalidateQueries(currentUserQuery);
        toast.success("Адрес изменён. Подтвердите его по ссылке из письма.");
      },
      onError: (error) => {
        if (error.status === 403) {
          if (
            error.code === "verified_email_required" ||
            error.message === "verified email required"
          ) {
            toast.error("Сначала подтвердите текущий адрес почты.");
          } else {
            form.setError("currentPassword", {
              message: "Неверный текущий пароль",
            });
          }
          return;
        }
        if (error.status === 409) {
          form.setError("newEmail", { message: "Этот адрес уже используется" });
          return;
        }
        toast.error(
          getRequestErrorMessage(error, "Не удалось изменить почту."),
        );
      },
    },
  });

  const onSubmit = (value: ChangeEmailFormData) => {
    changeEmailMutation.mutate({
      data: {
        new_email: value.newEmail,
        current_password: value.currentPassword,
      },
    });
  };

  return {
    register: form.register,
    errors: form.formState.errors,
    handleSubmit: form.handleSubmit(onSubmit),
    isDisabled: !data?.is_email_verified,
    isPending: changeEmailMutation.isPending,
    error: changeEmailMutation.error,
  };
}
