"use client";

import {
  RegisterByUsernameFormData,
  RegisterByUsernameSchema,
} from "@/features/register-by-username/model/schema";
import { registerByUsername } from "@/features/register-by-username/api";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { router } from "next/client";
import { useAuth } from "@/app/providers/auth-provider";

export function useRegisterForm() {
  const { setAuthenticatedUser, setLoading, setError } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterByUsernameFormData>({
    resolver: zodResolver(RegisterByUsernameSchema),
  });

  async function onSubmit(data: RegisterByUsernameFormData) {
    try {
      setLoading();
      const user = await registerByUsername(data);
      setAuthenticatedUser(user);
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
