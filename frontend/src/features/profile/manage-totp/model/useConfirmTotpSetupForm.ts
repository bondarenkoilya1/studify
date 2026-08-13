import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { type TotpFormData, totpSchema } from "./schema";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/shared/api";
import { useState } from "react";
import { confirmTotpSetup } from "@/features/profile/manage-totp/api/confirm-totp-setup";

export function useConfirmTOTPSetupForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TotpFormData>({
    resolver: zodResolver(totpSchema),
    defaultValues: { passcode: "" },
  });

  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const confirmTotpSetupMutation = useMutation({
    mutationFn: confirmTotpSetup,
    onSuccess: (data) => {
      setRecoveryCodes(data.codes);
      setIsDialogOpen(true);
    },
  });

  const handleConfirm = (data: TotpFormData) => {
    confirmTotpSetupMutation.mutate(data.passcode);
  };

  const closeRecoveryCodes = () => {
    setIsDialogOpen(false);
    queryClient.invalidateQueries({ queryKey: ["user"] });
  };

  return {
    register,
    errors,
    recoveryCodes,
    onSubmit: handleSubmit(handleConfirm),
    isPending: confirmTotpSetupMutation.isPending,
    isSuccess: isDialogOpen,
    isError: confirmTotpSetupMutation.isError,
    error: confirmTotpSetupMutation.error,
    closeRecoveryCodes,
  };
}
