// features/auth/login-by-email/model/use-verify-reset-password-token.ts
import { useEffect, useState } from "react";
import { verifyResetPasswordToken } from "../../api/reset-password/verify-reset-password-token";

export function useVerifyResetPasswordToken(token: string | undefined) {
  const [isValidating, setIsValidating] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setIsValidating(false);
      setIsValid(false);
      setError("Токен отсутствует");
      return;
    }

    let isMounted = true;

    verifyResetPasswordToken(token)
      .then(() => {
        if (isMounted) {
          setIsValid(true);
          setError(null);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setIsValid(false);
          setError(err.message || "Ссылка недействительна или устарела");
        }
      })
      .finally(() => {
        if (isMounted) setIsValidating(false);
      });

    return () => {
      isMounted = false;
    };
  }, [token]);

  return { isValidating, isValid, error };
}
