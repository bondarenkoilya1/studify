import {
  type RegisterByUsernameFormData,
  RegisterByUsernameSchema,
} from "@/features/register-by-username/model/schema";
import { registerByUsername } from "@/features/register-by-username/api";
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
  } = useForm<RegisterByUsernameFormData>({
    resolver: zodResolver(RegisterByUsernameSchema),
  });

  const registerMutation = useMutation({
    mutationFn: registerByUsername,

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
