import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { type TotpFormData, totpSchema } from "./schema";
import { useMutation } from "@tanstack/react-query";
import { validateTotp } from "../api/validate-totp";
import { queryClient } from "@/shared/api";
import { useState } from "react";

export function useValidateTotpForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TotpFormData>({
    resolver: zodResolver(totpSchema),
    defaultValues: { passcode: "" },
  });

  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);

  const validateTotpMutation = useMutation({
    mutationFn: validateTotp,
    onSuccess: (data) => {
      setRecoveryCodes(data.codes);
      setDialogOpen(true);
    },
  });

  const handleValidate = (data: TotpFormData) => {
    validateTotpMutation.mutate(data.passcode);
  };

  const closeRecoveryCodes = () => {
    setDialogOpen(false);
    queryClient.invalidateQueries({ queryKey: ["user"] });
  };

  return {
    register,
    errors,
    recoveryCodes,
    onSubmit: handleSubmit(handleValidate),
    isPending: validateTotpMutation.isPending,
    isSuccess: dialogOpen,
    isError: validateTotpMutation.isError,
    error: validateTotpMutation.error,
    closeRecoveryCodes,
  };
}
