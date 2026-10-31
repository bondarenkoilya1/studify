import { useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { type DefaultValues, useForm } from "react-hook-form";
import { useEffect } from "react";

import {
  type ApiError,
  invalidateGetUserSharedProjects,
  NetworkError,
  useCreateSharedProject,
} from "@/shared/api";
import { useCurrentUser } from "@/entities/user";
import { toast } from "@/shared/ui/sonner";
import { toAbsoluteUrl } from "@/shared/utils";
import {
  createSharedProjectSchema,
  type CreateSharedProjectFormValues,
} from "./schema";

function getSharedProjectErrorMessage(error: ApiError): string {
  if (error instanceof NetworkError) {
    return "Не удалось создать общий предмет. Проверьте подключение к сети.";
  }
  if (error.status === 409) {
    return "Общий предмет с такой ссылкой уже существует.";
  }
  return error.message || "Не удалось создать общий предмет.";
}

export function useCreateSharedProjectForm(onSuccess?: () => void) {
  const queryClient = useQueryClient();
  const { data: user } = useCurrentUser();

  const profileName = user?.email ? (user.email.split("@")[0] ?? "") : "";
  const hasProfileAvatar = Boolean(user?.avatar_url);

  const defaultValues: DefaultValues<CreateSharedProjectFormValues> = {
    name: "",
    url: "",
    use_profile_name: true,
    custom_author: "",
    use_profile_avatar: hasProfileAvatar,
    custom_avatar_url: "",
  };

  const form = useForm<CreateSharedProjectFormValues>({
    resolver: zodResolver(createSharedProjectSchema),
    defaultValues,
  });

  // Sync avatar checkbox state if user data loads after initial mount
  useEffect(() => {
    if (user?.avatar_url && !form.formState.isDirty) {
      form.setValue("use_profile_avatar", true);
    }
  }, [user?.avatar_url, form]);

  const mutation = useCreateSharedProject({
    mutation: {
      onError: (error) => {
        const message = getSharedProjectErrorMessage(error);
        form.setError("root", { message });
        toast.error(message);
      },
      onSuccess: async () => {
        await invalidateGetUserSharedProjects(queryClient);
        toast.success("Общий предмет успешно создан!");
        form.reset({
          name: "",
          url: "",
          use_profile_name: true,
          custom_author: "",
          use_profile_avatar: Boolean(user?.avatar_url),
          custom_avatar_url: "",
        });
        form.clearErrors("root");
        onSuccess?.();
      },
    },
  });

  const submit = form.handleSubmit((values) => {
    const author = values.use_profile_name
      ? (profileName || "Студент")
      : (values.custom_author?.trim() || "Студент");

    const author_avatar_url = values.use_profile_avatar
      ? (user?.avatar_url ? toAbsoluteUrl(user.avatar_url) : "")
      : (values.custom_avatar_url?.trim() || "");

    mutation.mutate({
      data: {
        name: values.name.trim(),
        url: values.url.trim(),
        author,
        author_avatar_url,
      },
    });
  });

  return {
    ...form,
    submit,
    isPending: mutation.isPending,
    error: mutation.error,
    user,
    profileName,
    hasProfileAvatar,
  };
}
