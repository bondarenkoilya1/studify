import { useState } from "react";
import { useDisableTotp } from "../model/use-disable-totp";
import { ConfirmDeleteDialog } from "@/shared/ui/confirm-delete-dialog";

export function DisableTotpButton() {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const { mutate, isPending } = useDisableTotp();

  const handleConfirm = () => {
    mutate(undefined, {
      onSuccess: () => {
        setIsConfirmOpen(false);
      },
    });
  };

  return (
    <>
      <button
        type="button"
        className="
          inline-flex items-center justify-center
          rounded-lg border border-red-500/20
          bg-red-500/5 px-4 py-2
          text-sm font-medium text-red-500
          transition-colors
          hover:border-red-500/30
          hover:bg-red-500/10
          focus-visible:outline-none
          focus-visible:ring-2
          focus-visible:ring-red-500/30
          disabled:pointer-events-none
          disabled:opacity-50
        "
        disabled={isPending}
        onClick={() => setIsConfirmOpen(true)}
      >
        Disable 2FA
      </button>

      <ConfirmDeleteDialog
        open={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        title="Отключить двухфакторную аутентификацию?"
        description="Защита вашего аккаунта будет снижена. При следующем входе код из приложения аутентификации запрашиваться не будет."
        onConfirm={handleConfirm}
        isPending={isPending}
      />
    </>
  );
}
