import { Loader2, Trash2 } from "lucide-react";

import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { Button } from "@/shared/ui/button";

export interface ConfirmDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  onConfirm: () => void;
  isPending?: boolean;
}

export function ConfirmDeleteDialog({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
  isPending = false,
}: ConfirmDeleteDialogProps) {
  const handleConfirm = () => {
    onConfirm();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange} className="max-w-md">
      <DialogClose />

      <DialogHeader className="items-center text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400">
          <Trash2 className="size-6" />
        </div>
        <DialogTitle className="mt-2 text-xl">{title}</DialogTitle>
        <DialogDescription className="text-sm text-muted-foreground">
          {description}
        </DialogDescription>
      </DialogHeader>

      <DialogFooter className="mt-5 flex flex-row gap-2.5 sm:justify-end">
        <Button
          type="button"
          variant="outline"
          disabled={isPending}
          onClick={() => onOpenChange(false)}
          className="flex-1 cursor-pointer"
        >
          Отмена
        </Button>
        <Button
          type="button"
          variant="destructive"
          disabled={isPending}
          onClick={handleConfirm}
          className="flex-1 cursor-pointer gap-2"
        >
          {isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              <span>Удаление...</span>
            </>
          ) : (
            <span>Удалить</span>
          )}
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
