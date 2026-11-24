import { Button } from "@/shared/ui/button";
import { useResendEmailConfirmation } from "../model/use-resend-email-confirmation";

export function ResendEmailButton() {
  const { send, isPending, isSuccess, errorMessage } =
    useResendEmailConfirmation();

  return (
    <div className="max-w-xs">
      <Button variant="link" type="button" onClick={send} disabled={isPending}>
        {isPending ? "Отправляем..." : "Отправить письмо ещё раз"}
      </Button>
      {isSuccess && (
        <p role="status" className="text-sm text-muted-foreground">
          Письмо отправлено. Проверьте входящие.
        </p>
      )}
      {errorMessage && (
        <p role="alert" className="text-sm text-destructive">
          {errorMessage}
        </p>
      )}
    </div>
  );
}
