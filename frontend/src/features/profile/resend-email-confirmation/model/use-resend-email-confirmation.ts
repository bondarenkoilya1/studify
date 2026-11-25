import { useResendConfirmationEmail } from "@/shared/api";
import { getRequestErrorMessage } from "@/shared/api/request-error-message";

export function useResendEmailConfirmation() {
  const { mutate, isPending, isSuccess, error } = useResendConfirmationEmail();
  const errorMessage = error
    ? getRequestErrorMessage(
        error,
        error.status === 429
          ? "Письмо уже запрошено. Попробуйте ещё раз через минуту."
          : "Не удалось отправить письмо. Попробуйте ещё раз.",
      )
    : null;

  return { send: () => mutate(), isPending, isSuccess, errorMessage };
}
