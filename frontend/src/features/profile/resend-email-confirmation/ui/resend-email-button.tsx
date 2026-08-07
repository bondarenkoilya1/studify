import { cn } from "@/shared/lib/cn";
import { useResendEmailConfirmation } from "../model/useResendEmailConfirmation";

export function ResendEmailButton() {
  const { isDisabled, handleClick } = useResendEmailConfirmation();

  return (
    <button
      onClick={handleClick}
      type="button"
      disabled={isDisabled}
      className={cn(
        "text-sm cursor-pointer hover:underline transition-colors",
        isDisabled
          ? "text-gray-400 cursor-not-allowed"
          : "text-blue-600 hover:text-blue-700",
      )}
    >
      Resend email
    </button>
  );
}
