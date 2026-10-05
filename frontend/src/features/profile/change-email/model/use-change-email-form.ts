import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { currentUserQuery, useCurrentUser } from "@/entities/user";
import { useUpdateUserEmail } from "@/shared/api";
import { toast } from "@/shared/ui/sonner";
import { ChangeEmailSchema, type ChangeEmailFormData } from "./schema";

export function useChangeEmailForm() {
  const { data } = useCurrentUser();
  const queryClient = useQueryClient();

  const form = useForm<ChangeEmailFormData>({
    resolver: zodResolver(ChangeEmailSchema),
    defaultValues: {
      newEmail: "",
    },
  });

  const changeEmailMutation = useUpdateUserEmail({
    mutation: {
      onSuccess: async () => {
        // The response omits some profile fields, so refetch the full user.
        await queryClient.invalidateQueries(currentUserQuery);
        toast.success("Your email was successfully updated!");
      },
      onError: () => toast.error("Failed to update email."),
    },
  });

  const onSubmit = (value: ChangeEmailFormData) => {
    changeEmailMutation.mutate({ data: { new_email: value.newEmail } });
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
