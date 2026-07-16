"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useAuth } from "@/shared/providers";
import { loginByUsername } from "@/features/login-by-username/api";
import { LoginByUsernameFormData, LoginByUsernameSchema } from "@/features/login-by-username";

export function useLoginForm() {
  const router = useRouter();
  const { setUser } = useAuth();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginByUsernameFormData>({
    resolver: zodResolver(LoginByUsernameSchema),
  });

  const onSubmit = handleSubmit(async (data) => {
    try {
      const user = await loginByUsername(data);
      setUser(user);
      router.push("/");
      router.refresh();
    } catch {
      setError("root", {
        message: "Invalid username or password",
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
