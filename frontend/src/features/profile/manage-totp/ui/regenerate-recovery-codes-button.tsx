import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useRegenerateRecoveryCodes } from "@/shared/api";
import { getRequestErrorMessage } from "@/shared/api/request-error-message";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogBody,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { FormField } from "@/shared/ui/form-field";
import { Input } from "@/shared/ui/input";
import { totpSchema, type TotpFormData } from "../model/schema";
import { RecoveryCodesDialog } from "./recovery-codes-dialog";

export function RegenerateRecoveryCodesButton() {
  const [isOpen, setIsOpen] = useState(false);
  const form = useForm<TotpFormData>({
    resolver: zodResolver(totpSchema),
    defaultValues: { passcode: "" },
  });
  const mutation = useRegenerateRecoveryCodes({
    mutation: {
      gcTime: 0,
      onSuccess: () => {
        form.reset();
        setIsOpen(false);
      },
      onError: (error) => {
        form.setError("root", {
          message: getRequestErrorMessage(
            error,
            error.status === 400
              ? "Код аутентификатора неверен или уже истёк."
              : "Не удалось выпустить новые резервные коды.",
          ),
        });
      },
    },
  });
  const errors = form.formState.errors;
  const errorMessage = errors.passcode?.message ?? errors.root?.message;
  const changeOpen = (open: boolean) => {
    if (mutation.isPending) return;
    form.reset();
    setIsOpen(open);
  };

  return (
    <>
      <Button type="button" variant="outline" onClick={() => changeOpen(true)}>
        Выпустить резервные коды
      </Button>

      <Dialog open={isOpen} onOpenChange={changeOpen} className="max-w-md">
        <DialogHeader>
          <DialogTitle>Выпустить новые резервные коды?</DialogTitle>
          <DialogDescription>
            Подтвердите действие кодом из приложения. Предыдущие резервные коды
            перестанут действовать.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit((data) => mutation.mutate({ data }))}>
          <DialogBody>
            <FormField
              htmlFor="recovery-code-passcode"
              label="Код аутентификатора"
            >
              <Input
                id="recovery-code-passcode"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                aria-invalid={Boolean(errors.passcode)}
                aria-describedby={
                  errorMessage ? "recovery-code-error" : undefined
                }
                {...form.register("passcode")}
              />
            </FormField>
            {errorMessage && (
              <p
                id="recovery-code-error"
                role="alert"
                className="mt-2 text-sm text-destructive"
              >
                {errorMessage}
              </p>
            )}
          </DialogBody>
          <DialogFooter className="flex-row justify-end">
            <Button
              type="button"
              variant="outline"
              disabled={mutation.isPending}
              onClick={() => changeOpen(false)}
            >
              Отмена
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Выпускаем..." : "Выпустить коды"}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>

      {mutation.data && (
        <RecoveryCodesDialog
          open
          codes={mutation.data.codes}
          onOpenChange={mutation.reset}
        />
      )}
    </>
  );
}
