import { useState } from "react";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogBody,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { useDisableTotp } from "../model/use-disable-totp";

export function DisableTotpButton() {
  const [isOpen, setIsOpen] = useState(false);
  const { mutate, reset, isPending, errorMessage } = useDisableTotp();

  const openConfirmation = () => {
    reset();
    setIsOpen(true);
  };

  const changeOpen = (open: boolean) => {
    if (!isPending) setIsOpen(open);
  };

  return (
    <>
      <Button type="button" variant="destructive" onClick={openConfirmation}>
        Отключить 2FA
      </Button>

      <Dialog open={isOpen} onOpenChange={changeOpen} className="max-w-md">
        <DialogHeader>
          <DialogTitle>Отключить двухфакторную аутентификацию?</DialogTitle>
          <DialogDescription>
            Для входа будет достаточно пароля. Сохранённые резервные коды
            перестанут действовать.
          </DialogDescription>
        </DialogHeader>
        {errorMessage && (
          <DialogBody>
            <p role="alert" className="text-sm text-destructive">
              {errorMessage}
            </p>
          </DialogBody>
        )}
        <DialogFooter className="flex-row justify-end">
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={() => changeOpen(false)}
          >
            Отмена
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={isPending}
            onClick={() =>
              mutate(undefined, { onSuccess: () => setIsOpen(false) })
            }
          >
            {isPending ? "Отключаем..." : "Отключить"}
          </Button>
        </DialogFooter>
      </Dialog>
    </>
  );
}
