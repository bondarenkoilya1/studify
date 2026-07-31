import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { type LoginByEmailFormData, LoginByEmailSchema } from "./schema";
import { loginByEmail } from "../api/login-by-email";

export function useLoginForm() {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginByEmailFormData>({
    resolver: zodResolver(LoginByEmailSchema),
  });
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const loginMutation = useMutation({
    mutationFn: loginByEmail,
    onSuccess: () => {
      queryClient
        .invalidateQueries({ queryKey: ["user"] })
        .then(() => navigate({ to: "/" }));
    },
    onError: () =>
      setError("root", {
        message: "Invalid email or password",
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
