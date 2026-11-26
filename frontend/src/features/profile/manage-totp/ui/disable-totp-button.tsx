import { useState, type FormEvent } from "react";
import { Button } from "@/shared/ui/button";
import { FormField } from "@/shared/ui/form-field";
import { Input } from "@/shared/ui/input";
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
  const [password, setPassword] = useState("");
  const { mutate, reset, isPending, errorMessage } = useDisableTotp();

  const openConfirmation = () => {
    reset();
    setIsOpen(true);
  };

  const changeOpen = (open: boolean) => {
    if (isPending) return;
    if (!open) setPassword("");
    setIsOpen(open);
  };

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!password || isPending) return;
    mutate(
      { data: { current_password: password } },
      {
        onSuccess: () => {
          setPassword("");
          setIsOpen(false);
        },
      },
    );
  }

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
        <form onSubmit={submit}>
          <DialogBody>
            <FormField htmlFor="disable-totp-password" label="Текущий пароль">
              <Input
                id="disable-totp-password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.currentTarget.value)}
                aria-invalid={Boolean(errorMessage)}
                disabled={isPending}
              />
              {errorMessage && (
                <p role="alert" className="text-sm text-destructive">
                  {errorMessage}
                </p>
              )}
            </FormField>
          </DialogBody>
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
              type="submit"
              variant="destructive"
              disabled={isPending || !password}
            >
              {isPending ? "Отключаем..." : "Отключить"}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </>
  );
}
