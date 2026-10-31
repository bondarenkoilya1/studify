import { useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { type DefaultValues, useForm } from "react-hook-form";
import { useEffect } from "react";

import {
  type ApiError,
  invalidateGetUserSharedProjects,
  NetworkError,
  type SharedProjectRequest,
  useCreateSharedProject,
} from "@/shared/api";
import { useCurrentUser } from "@/entities/user";
import { toast } from "@/shared/ui/sonner";
import {
  createSharedProjectSchema,
  type CreateSharedProjectFormValues,
} from "./schema";

function toCreateSharedProjectRequest(
  values: CreateSharedProjectFormValues,
  fallbackAvatarUrl?: string | null,
): SharedProjectRequest {
  return {
    name: values.name.trim(),
    url: values.url.trim(),
    author: values.author.trim(),
    author_avatar_url:
      values.author_avatar_url?.trim() || fallbackAvatarUrl || "",
  };
}

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

  const defaultValues: DefaultValues<CreateSharedProjectFormValues> = {
    name: "",
    url: "",
    author: user?.email ? (user.email.split("@")[0] ?? "") : "",
    author_avatar_url: user?.avatar_url ?? "",
  };

  const form = useForm<CreateSharedProjectFormValues>({
    resolver: zodResolver(createSharedProjectSchema),
    defaultValues,
  });

  // Keep author prefilled if user loads after mount
  useEffect(() => {
    if (user?.email && !form.getValues("author")) {
      form.setValue("author", user.email.split("@")[0] ?? "");
    }
    if (user?.avatar_url && !form.getValues("author_avatar_url")) {
      form.setValue("author_avatar_url", user.avatar_url);
    }
  }, [user, form]);

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
          author: user?.email ? (user.email.split("@")[0] ?? "") : "",
          author_avatar_url: user?.avatar_url ?? "",
        });
        form.clearErrors("root");
        onSuccess?.();
      },
    },
  });

  const submit = form.handleSubmit((values) =>
    mutation.mutate({
      data: toCreateSharedProjectRequest(values, user?.avatar_url),
    }),
  );

  return {
    ...form,
    submit,
    isPending: mutation.isPending,
    error: mutation.error,
  };
}
