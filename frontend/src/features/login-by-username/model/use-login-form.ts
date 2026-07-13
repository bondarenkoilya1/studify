"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useAuth } from "@/shared/providers";
import { loginByUsername } from "@/features/login-by-username/api";
import { LoginByUsernameFormData, LoginByUsernameSchema } from "@/features/login-by-username";

export function useLoginForm() {
  const router = useRouter();
  const { setAuthenticatedUser, setLoading, setError } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginByUsernameFormData>({
    resolver: zodResolver(LoginByUsernameSchema),
  });

  async function onSubmit(data: LoginByUsernameFormData) {
    try {
      setLoading();
      const user = await loginByUsername(data);
      setAuthenticatedUser(user);
      router.push("/");
    } catch {
      setError();
    }
  }

  return {
    registerField: register,
    errors,
    isSubmitting,
    onSubmit: handleSubmit(onSubmit),
  };
}
