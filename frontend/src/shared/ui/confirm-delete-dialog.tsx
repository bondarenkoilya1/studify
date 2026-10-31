import { useState } from "react";
import { Loader2, Trash2 } from "lucide-react";

import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { Button } from "@/shared/ui/button";
import { Checkbox } from "@/shared/ui/checkbox";

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
  const [dontAskAgain, setDontAskAgain] = useState(false);

  const handleConfirm = () => {
    onConfirm();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange} className="max-w-md">
      <DialogClose onClick={() => onOpenChange(false)} />

      <DialogHeader className="items-center text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400">
          <Trash2 className="size-6" />
        </div>
        <DialogTitle className="mt-2 text-xl">{title}</DialogTitle>
        <DialogDescription className="text-sm text-muted-foreground">
          {description}
        </DialogDescription>
      </DialogHeader>

      <DialogBody className="mt-4 space-y-4">
        {/* Чекбокс «Не спрашивать больше» — визуал по канонам UX */}
        <label
          htmlFor="confirm-delete-dont-ask"
          className="flex cursor-pointer select-none items-center gap-2.5 rounded-xl border border-border/60 bg-muted/30 px-3.5 py-2.5 transition-colors hover:bg-muted/50"
        >
          <Checkbox
            id="confirm-delete-dont-ask"
            checked={dontAskAgain}
            onCheckedChange={(checked) => setDontAskAgain(Boolean(checked))}
          />
          <span className="text-sm font-medium text-muted-foreground">
            Не спрашивать больше
          </span>
        </label>

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
      </DialogBody>
    </Dialog>
  );
}
