import { useCurrentUser } from "@/entities/user";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { changeEmail } from "@/features/change-email/api/change-email";
import { ChangeEmailSchema, type ChangeEmailFormData } from "./schema";
import { queryClient } from "@/shared/api";
import { toast } from "react-toastify";

export function useChangeEmailForm() {
  const { data } = useCurrentUser();

  const form = useForm<ChangeEmailFormData>({
    resolver: zodResolver(ChangeEmailSchema),
    defaultValues: {
      newEmail: "",
    },
  });

  const changeEmailMutation = useMutation({
    mutationFn: (values: ChangeEmailFormData) => changeEmail(values.newEmail),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user"] });
      toast.success("Your email was successfully updated!");
    },
    onError: () => toast.error("Failed to update email."),
  });

  const onSubmit = (value: ChangeEmailFormData) => {
    changeEmailMutation.mutate(value);
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
