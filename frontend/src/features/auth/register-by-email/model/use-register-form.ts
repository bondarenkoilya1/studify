import { type RegisterByEmailFormData, RegisterByEmailSchema } from "./schema";
import { registerByEmail } from "../api/register-by-email";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";

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

  const registerMutation = useMutation({
    mutationFn: registerByEmail,

    onError: () => {
      setError("root", {
        message: "Failed to register",
      });
    },

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["user"],
      });

      navigate({
        to: "/",
      });
    },
  });

  const onSubmit = handleSubmit((data) => {
    registerMutation.mutate(data);
  });

  return {
    registerField: register,
    errors,
    isSubmitting: registerMutation.isPending,
    onSubmit,
  };
}
