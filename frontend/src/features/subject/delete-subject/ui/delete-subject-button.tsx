import { Trash2 } from "lucide-react";

import { useDeleteSubject } from "../model/use-delete-subject";

export function DeleteSubjectButton({ id }: { id: number }) {
  const { mutate, isPending } = useDeleteSubject();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => mutate({ id })}
      aria-label="Delete subject"
      className="
        flex h-9 w-9 items-center justify-center rounded-lg
        bg-red-500/10 text-red-500 transition-colors
        cursor-pointer hover:bg-red-500/20
        disabled:cursor-not-allowed disabled:opacity-50
      "
    >
      <Trash2 className="h-4 w-4" />
    </button>
  );
}
