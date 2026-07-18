import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginByUsername } from "@/features/login-by-username/api";
import {
  type LoginByUsernameFormData,
  LoginByUsernameSchema,
} from "@/features/login-by-username";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";

export function useLoginForm() {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginByUsernameFormData>({
    resolver: zodResolver(LoginByUsernameSchema),
  });
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const loginMutation = useMutation({
    mutationFn: loginByUsername,
    onSuccess: () => {
      queryClient
        .invalidateQueries({ queryKey: ["user"] })
        .then(() => navigate({ to: "/" }));
    },
    onError: () =>
      setError("root", {
        message: "Invalid username or password",
      }),
  });

  const onSubmit = handleSubmit((data) => loginMutation.mutate(data));

  return {
    registerField: register,
    errors,
    isSubmitting: loginMutation.isPending,
    onSubmit,
  };
}
