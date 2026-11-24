import { type RegisterByEmailFormData, RegisterByEmailSchema } from "./schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { startSession } from "@/entities/user";
import { useRegisterUser } from "@/shared/api";
import { getRequestErrorMessage } from "@/shared/api/request-error-message";

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
      onError: (error) => {
        if (error.status === 409) {
          setError("email", { message: "Аккаунт с этой почтой уже существует." });
          return;
        }

        setError("root", {
          message: getRequestErrorMessage(
            error,
            "Не удалось зарегистрироваться. Проверьте почту и пароль.",
          ),
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
