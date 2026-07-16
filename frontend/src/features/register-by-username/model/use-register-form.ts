"use client";

import {
  RegisterByUsernameFormData,
  RegisterByUsernameSchema,
} from "@/features/register-by-username/model/schema";
import { registerByUsername } from "@/features/register-by-username/api";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { useAuth } from "@/shared/providers";

export function useRegisterForm() {
  const router = useRouter();
  const { setUser } = useAuth();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterByUsernameFormData>({
    resolver: zodResolver(RegisterByUsernameSchema),
  });

  const onSubmit = handleSubmit(async (data) => {
    try {
      const user = await registerByUsername(data);
      setUser(user);
      router.push("/");
      router.refresh();
    } catch {
      setError("root", {
        message: "Failed to register",
      });
    }
  });

  return {
    registerField: register,
    errors,
    isSubmitting,
    onSubmit,
  };
}
