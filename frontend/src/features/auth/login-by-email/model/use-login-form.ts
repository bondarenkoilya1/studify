import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";

import { startSession } from "@/entities/user";
import {
  type ApiError,
  type User,
  useLoginTOTP,
  useLoginUser,
} from "@/shared/api";
import { getRequestErrorMessage } from "@/shared/api/request-error-message";
import { isLoginChallenge } from "./auth-response";
import {
  LoginCredentialsSchema,
  LoginRecoverySchema,
  LoginTotpSchema,
  type LoginCredentialsFormData,
  type LoginMfaFormData,
  type LoginMfaMethod,
} from "./schema";

function getMfaErrorMessage(error: ApiError, method: LoginMfaMethod) {
  if (error.status === 401) {
    if (
      error.code === "invalid_mfa_challenge" ||
      error.message === "invalid or expired challenge"
    ) {
      return "Время для подтверждения входа истекло. Вернитесь к вводу пароля.";
    }
    return method === "totp"
      ? "Код аутентификатора неверен или уже истёк."
      : "Резервный код неверен или уже был использован.";
  }
  return getRequestErrorMessage(
    error,
    "Не удалось подтвердить вход. Попробуйте ещё раз.",
  );
}

export function useLoginForm({
  confirmToken,
  subjectId,
  taskId,
  subjectEvent,
}: {
  confirmToken?: string;
  subjectId?: number;
  taskId?: number;
  subjectEvent?: boolean;
}) {
  const [method, setMethod] = useState<LoginMfaMethod>("totp");
  const [challengeToken, setChallengeToken] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const credentialsForm = useForm<LoginCredentialsFormData>({
    resolver: zodResolver(LoginCredentialsSchema),
  });
  const mfaForm = useForm<LoginMfaFormData>({
    resolver: zodResolver(
      method === "totp" ? LoginTotpSchema : LoginRecoverySchema,
    ),
    defaultValues: { code: "" },
  });

  const completeLogin = async (user: User) => {
    startSession(queryClient, user);
    if (confirmToken) {
      await navigate({
        to: "/confirm",
        search: { token: confirmToken },
        replace: true,
      });
      return;
    }
    if (subjectId) {
      await navigate({
        to: "/subjects/$id",
        params: { id: subjectId },
        search: { task: taskId, event: subjectEvent },
        replace: true,
      });
      return;
    }
    await navigate({ to: "/subjects" });
  };

  const loginMutation = useLoginUser({
    mutation: {
      onSuccess: async (response) => {
        if (isLoginChallenge(response)) {
          setChallengeToken(response.challenge_token);
          return;
        }
        await completeLogin(response);
      },
      onError: (error) => {
        credentialsForm.setError("root", {
          message: getRequestErrorMessage(
            error,
            error.status === 401
              ? "Неверная почта или пароль."
              : "Не удалось войти. Попробуйте ещё раз.",
          ),
        });
      },
    },
  });

  const mfaMutation = useLoginTOTP({
    mutation: {
      onSuccess: completeLogin,
      onError: (error) => {
        mfaForm.setError("root", {
          message: getMfaErrorMessage(error, method),
        });
      },
    },
  });

  const submitCredentials = credentialsForm.handleSubmit((data) => {
    loginMutation.mutate({ data });
  });

  const submitMfa = mfaForm.handleSubmit(({ code }) => {
    if (challengeToken) {
      mfaMutation.mutate({ data: { challenge_token: challengeToken, code } });
    }
  });

  const changeMethod = (nextMethod: LoginMfaMethod) => {
    setMethod(nextMethod);
    mfaForm.reset();
  };

  return {
    needsMfa: challengeToken !== null,
    credentials: {
      registerField: credentialsForm.register,
      errors: credentialsForm.formState.errors,
      isSubmitting: loginMutation.isPending,
      onSubmit: submitCredentials,
    },
    mfa: {
      method,
      control: mfaForm.control,
      errors: mfaForm.formState.errors,
      isSubmitting: mfaMutation.isPending,
      onSubmit: submitMfa,
      onMethodChange: changeMethod,
    },
    goBack: () => {
      setChallengeToken(null);
      changeMethod("totp");
    },
  };
}
