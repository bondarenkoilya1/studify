import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { type TotpFormData, totpSchema } from "./schema";
import { useMutation } from "@tanstack/react-query";
import { validateTotp } from "../api/validate-totp";
import { queryClient } from "@/shared/api";

export function useValidateTotpForm() {
  const {
    register,
    watch,
    handleSubmit,
    formState: { errors },
  } = useForm<TotpFormData>({
    resolver: zodResolver(totpSchema),
    defaultValues: {
      passcode: "",
    },
  });

  const validateTotpMutation = useMutation({
    mutationFn: validateTotp,

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["user"],
      });
    },
  });

  const handleValidate = (data: TotpFormData) => {
    validateTotpMutation.mutate(data.passcode);
  };

  return {
    register,
    watch,
    handleSubmit,
    errors,
    handleValidate,
    isPending: validateTotpMutation.isPending,
    isSuccess: validateTotpMutation.isSuccess,
    isError: validateTotpMutation.isError,
    error: validateTotpMutation.error,
  };
}
