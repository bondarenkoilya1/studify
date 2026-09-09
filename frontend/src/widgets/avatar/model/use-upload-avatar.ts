import { useMutation, useQueryClient } from "@tanstack/react-query";
import { httpClient } from "@/shared/api";

interface UploadAvatarResponse {
  avatarUrl: string;
}

export function useUploadAvatar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => {
      return httpClient.post<UploadAvatarResponse>(
        "/api/users/me/avatar",
        file,
        { headers: { "Content-Type": file.type || "image/png" } },
      );
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["user"], (old: any) => {
        if (!old) return old;
        return { ...old, avatarUrl: `${data.avatarUrl}?t=${Date.now()}` };
      });

      queryClient.invalidateQueries({ queryKey: ["user"] });
    },
  });
}
