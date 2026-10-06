import { useMutation, useQueryClient } from "@tanstack/react-query";
import { currentUserQuery } from "@/entities/user";
import { uploadUserAvatar } from "@/shared/api";

export function useUploadAvatar() {
  const queryClient = useQueryClient();

  return useMutation({
    // The spec lists several image types, so send the file's real one.
    mutationFn: (file: File) =>
      uploadUserAvatar(file, {
        headers: { "Content-Type": file.type || "application/octet-stream" },
      }),
    onSuccess: ({ avatar_url }) => {
      queryClient.setQueryData(currentUserQuery.queryKey, (user) =>
        user ? { ...user, avatar_url } : user,
      );
    },
  });
}
