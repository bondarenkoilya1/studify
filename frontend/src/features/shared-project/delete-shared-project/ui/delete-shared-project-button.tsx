import { useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { useDeleteSharedProject } from "../model/use-delete-shared-project";
import { ConfirmDeleteDialog } from "@/shared/ui/confirm-delete-dialog";

export function DeleteSharedProjectButton({
  id,
  projectName,
}: {
  id: number;
  projectName?: string;
}) {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const { mutate, isPending } = useDeleteSharedProject();

  const handleOpenConfirm = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    mutate(
      { id },
      {
        onSuccess: () => {
          setIsConfirmOpen(false);
        },
      },
    );
  };

  return (
    <>
      <button
        type="button"
        disabled={isPending}
        onClick={handleOpenConfirm}
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

      <ConfirmDeleteDialog
        open={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        title="Удалить общий предмет?"
        description={
          projectName
            ? `Вы собираетесь удалить общий предмет «${projectName}». Ссылка на него станет недоступна. Это действие необратимо.`
            : "Ссылка на этот общий предмет станет недоступна. Это действие необратимо."
        }
        onConfirm={handleConfirmDelete}
        isPending={isPending}
      />
    </>
  );
}
