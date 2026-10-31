import { useState } from "react";
import { Trash2 } from "lucide-react";

import { useDeleteSubject } from "../model/use-delete-subject";
import { ConfirmDeleteDialog } from "@/shared/ui/confirm-delete-dialog";

export function DeleteSubjectButton({
  id,
  subjectName,
}: {
  id: number;
  subjectName?: string;
}) {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const { mutate, isPending } = useDeleteSubject();

  const handleOpenConfirm = (e: React.MouseEvent) => {
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
        aria-label="Удалить предмет"
        title="Удалить предмет"
        className="
          flex h-9 w-9 items-center justify-center rounded-lg
          bg-red-500/10 text-red-500 transition-colors
          cursor-pointer hover:bg-red-500/20
          disabled:cursor-not-allowed disabled:opacity-50
        "
      >
        <Trash2 className="h-4 w-4" />
      </button>

      <ConfirmDeleteDialog
        open={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        title="Удалить предмет?"
        description={
          subjectName
            ? `Вы собираетесь удалить предмет «${subjectName}». Все связанные с ним задачи и файлы также будут удалены без возможности восстановления.`
            : "Все связанные с ним задачи и файлы также будут удалены без возможности восстановления."
        }
        onConfirm={handleConfirmDelete}
        isPending={isPending}
      />
    </>
  );
}
