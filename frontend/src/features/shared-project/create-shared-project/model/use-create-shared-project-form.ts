import { useMutation, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import {
  createSharedProject,
  getGetSharedProjectCatalogQueryKey,
  getGetSharedProjectQueryKey,
  invalidateGetUserSharedProjects,
  type SharedProject,
  updateSharedProject,
} from "@/shared/api";
import { getRequestErrorMessage } from "@/shared/api/request-error-message";
import { useCurrentUser } from "@/entities/user";
import { toast } from "@/shared/ui/sonner";
import { toAbsoluteUrl } from "@/shared/utils";
import {
  createSharedProjectSchema,
  type CreateSharedProjectFormValues,
} from "./schema";

export function useCreateSharedProjectForm(
  project?: SharedProject,
  onSuccess?: () => void,
) {
  const queryClient = useQueryClient();
  const { data: user } = useCurrentUser();
  const profileName = user?.email.split("@")[0] ?? "";
  const hasProfileAvatar = Boolean(user?.avatar_url);

  const form = useForm<CreateSharedProjectFormValues>({
    resolver: zodResolver(createSharedProjectSchema),
    defaultValues: {
      name: project?.name ?? "",
      url: project?.url ?? "",
      is_public: project?.is_public ?? false,
      use_profile_name: !project,
      custom_author: project?.author ?? "",
      use_profile_avatar: !project && hasProfileAvatar,
      custom_avatar_url: project?.author_avatar_url ?? "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: CreateSharedProjectFormValues) => {
      const data = {
        name: values.name,
        url: values.url,
        is_public: values.is_public,
        author: values.use_profile_name
          ? profileName || "Студент"
          : (values.custom_author ?? ""),
        author_avatar_url: values.use_profile_avatar
          ? user?.avatar_url
            ? toAbsoluteUrl(user.avatar_url)
            : ""
          : (values.custom_avatar_url ?? ""),
      };
      return project
        ? updateSharedProject(project.id, data)
        : createSharedProject(data);
    },
    onError: (error) => {
      form.setError("root", {
        message: getRequestErrorMessage(
          error,
          project
            ? "Не удалось сохранить общий предмет."
            : "Не удалось создать общий предмет.",
          {
            invalid: "Проверьте ссылку и данные автора.",
            conflict: "Общий предмет с такой ссылкой уже существует.",
          },
        ),
      });
    },
    onSuccess: async (saved) => {
      queryClient.setQueryData(getGetSharedProjectQueryKey(saved.id), saved);
      await Promise.all([
        invalidateGetUserSharedProjects(queryClient),
        queryClient.invalidateQueries({
          queryKey: getGetSharedProjectCatalogQueryKey(),
        }),
      ]);
      toast.success(project ? "Изменения сохранены" : "Общий предмет создан");
      onSuccess?.();
    },
  });

  return {
    ...form,
    submit: form.handleSubmit((values) => mutation.mutate(values)),
    isPending: mutation.isPending,
    user,
    profileName,
    hasProfileAvatar,
  };
}
