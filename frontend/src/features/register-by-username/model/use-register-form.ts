import {
  type RegisterByUsernameFormData,
  RegisterByUsernameSchema,
} from "@/features/register-by-username/model/schema";
import { registerByUsername } from "@/features/register-by-username/api";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

export function useRegisterForm() {
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
      console.log("User has been registered", user);
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
