import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { currentUserQuery } from "@/entities/user";
import { useConfirmTOTPSetup } from "@/shared/api";
import { type TotpFormData, totpSchema } from "./schema";

export function useConfirmTOTPSetupForm() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<TotpFormData>({
    resolver: zodResolver(totpSchema),
    defaultValues: { passcode: "" },
  });

  const confirmMutation = useConfirmTOTPSetup({
    mutation: {
      onSuccess: () => setIsDialogOpen(true),
      onError: () => setError("passcode", { message: "Invalid code" }),
    },
  });

  const closeRecoveryCodes = () => {
    setIsDialogOpen(false);
    // Refetching the user switches the section to the "enabled" state.
    void queryClient.invalidateQueries(currentUserQuery);
  };

  return {
    register,
    errors,
    recoveryCodes: confirmMutation.data?.codes ?? [],
    onSubmit: handleSubmit((data) => confirmMutation.mutate({ data })),
    isPending: confirmMutation.isPending,
    isSuccess: isDialogOpen,
    closeRecoveryCodes,
  };
}
