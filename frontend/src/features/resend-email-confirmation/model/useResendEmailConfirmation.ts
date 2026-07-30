import { useState } from "react";
import { resendEmailConfirmation } from "../api/resend-email-confirmation";

export function useResendEmailConfirmation() {
  const [isDisabled, setDisabled] = useState(false);

  async function handleClick() {
    try {
      setDisabled(true);
      await resendEmailConfirmation();
    } catch (error) {
      if (error instanceof Error) {
        console.error(error);
      }
    } finally {
      setDisabled(false);
    }
  }

  return { isDisabled, handleClick };
}
