import { useResendConfirmationEmail } from "@/shared/api";
import { toast } from "@/shared/ui/sonner";

export function useResendEmailConfirmation() {
  const { mutate, isPending } = useResendConfirmationEmail({
    mutation: {
      onSuccess: () => toast.success("Confirmation email sent."),
      onError: () => toast.error("Failed to send confirmation email."),
    },
  });

  return { isDisabled: isPending, handleClick: () => mutate() };
}
