import { Loader2, Trash2 } from "lucide-react";
import { useDeleteSharedProject } from "../model/use-delete-shared-project";

export function DeleteSharedProjectButton({ id }: { id: number }) {
  const { mutate, isPending } = useDeleteSharedProject();

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (isPending) return;
    mutate({ id });
  };

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={handleClick}
      aria-label="Удалить общий предмет"
      title="Удалить общий предмет"
      className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-destructive/20 bg-destructive/10 text-destructive transition-all hover:bg-destructive/20 hover:border-destructive/40 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {isPending ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <Trash2 className="size-4" />
      )}
    </button>
  );
}
