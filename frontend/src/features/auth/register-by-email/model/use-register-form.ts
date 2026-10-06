import { type RegisterByEmailFormData, RegisterByEmailSchema } from "./schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { startSession } from "@/entities/user";
import { useRegisterUser } from "@/shared/api";

export function useRegisterForm() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<RegisterByEmailFormData>({
    resolver: zodResolver(RegisterByEmailSchema),
  });

  const registerMutation = useRegisterUser({
    mutation: {
      onError: () => {
        setError("root", {
          message: "Failed to register",
        });
      },
      onSuccess: async (user) => {
        startSession(queryClient, user);
        await navigate({ to: "/subjects" });
      },
    },
  });

  const onSubmit = handleSubmit((data) => {
    registerMutation.mutate({ data });
  });

  return {
    registerField: register,
    errors,
    isSubmitting: registerMutation.isPending,
    onSubmit,
  };
}
