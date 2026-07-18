import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginByUsername } from "@/features/login-by-username/api";
import {
  type LoginByUsernameFormData,
  LoginByUsernameSchema,
} from "@/features/login-by-username";

export function useLoginForm() {
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
      console.log("User has been logged in", user);
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
