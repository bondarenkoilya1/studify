import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";

import {
  LoginCredentialsSchema,
  LoginTotpSchema,
  type LoginCredentialsFormData,
  type LoginTotpFormData,
} from "./schema";

import { loginByEmail } from "../api/login-by-email";
import { verifyLoginTotp } from "../api/verify-login-totp";
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

  const completeLogin = async () => {
    await queryClient.invalidateQueries({
      queryKey: ["user"],
    });

    await navigate({ to: "/subjects" });
  };

  const loginMutation = useMutation({
    mutationFn: loginByEmail,

    onSuccess: async (response) => {
      if (isLoginChallenge(response)) {
        setChallengeToken(response.challengeToken);
        setStep("totp");

        return;
      }

      await completeLogin();
    },

    onError: () => {
      credentialsForm.setError("root", {
        message: "Invalid email or password",
      });
    },
  });

  const totpMutation = useMutation({
    mutationFn: verifyLoginTotp,

    onSuccess: completeLogin,

    onError: () => {
      totpForm.setError("root", {
        message: "Invalid authentication code",
      });
    },
  });

  const submitCredentials = credentialsForm.handleSubmit((data) => {
    loginMutation.mutate(data);
  });

  const submitTotp = totpForm.handleSubmit((data) => {
    if (!challengeToken) {
      totpForm.setError("root", {
        message: "Login session has expired",
      });

      return;
    }

    totpMutation.mutate({
      challenge_token: challengeToken,
      code: data.totpCode,
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
