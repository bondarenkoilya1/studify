import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";

import { startSession } from "@/entities/user";
import { useLoginTOTP, useLoginUser, type User } from "@/shared/api";
import {
  LoginCredentialsSchema,
  LoginTotpSchema,
  type LoginCredentialsFormData,
  type LoginTotpFormData,
} from "./schema";
import { isLoginChallenge } from "./auth-response";

export function useLoginForm() {
  const [step, setStep] = useState<"credentials" | "totp">("credentials");
  const [challengeToken, setChallengeToken] = useState<string | null>(null);

  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const credentialsForm = useForm<LoginCredentialsFormData>({
    resolver: zodResolver(LoginCredentialsSchema),
  });

  const totpForm = useForm<LoginTotpFormData>({
    resolver: zodResolver(LoginTotpSchema),
  });

  const completeLogin = async (user: User) => {
    startSession(queryClient, user);
    await navigate({ to: "/subjects" });
  };

  const loginMutation = useLoginUser({
    mutation: {
      onSuccess: async (response) => {
        if (isLoginChallenge(response)) {
          setChallengeToken(response.challenge_token);
          setStep("totp");
          return;
        }

        await completeLogin(response);
      },
      onError: () => {
        credentialsForm.setError("root", {
          message: "Invalid email or password",
        });
      },
    },
  });

  const totpMutation = useLoginTOTP({
    mutation: {
      onSuccess: completeLogin,
      onError: () => {
        totpForm.setError("root", {
          message: "Invalid authentication code",
        });
      },
    },
  });

  const submitCredentials = credentialsForm.handleSubmit((data) => {
    loginMutation.mutate({ data });
  });

  const submitTotp = totpForm.handleSubmit((data) => {
    if (!challengeToken) {
      totpForm.setError("root", {
        message: "Login session has expired",
      });

      return;
    }

    totpMutation.mutate({
      data: { challenge_token: challengeToken, code: data.totpCode },
    });
  });

  const goBack = () => {
    setStep("credentials");
    setChallengeToken(null);
    totpForm.reset();
  };

  return {
    step,

    credentials: {
      registerField: credentialsForm.register,
      errors: credentialsForm.formState.errors,
      isSubmitting: loginMutation.isPending,
      onSubmit: submitCredentials,
    },

    totp: {
      control: totpForm.control,
      errors: totpForm.formState.errors,
      isSubmitting: totpMutation.isPending,
      onSubmit: submitTotp,
    },

    goBack,
  };
}
