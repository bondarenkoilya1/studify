import { useEffect, useRef } from "react";
import { toast } from "react-toastify";
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { Button } from "@/shared/ui/button";
import { FormField } from "@/shared/ui/form-field";
import { Input } from "@/shared/ui/input";
import { useForgotPassword } from "../model/reset-password/use-forgot-password";

export function ForgotPasswordDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const {
    register,
    formState: { errors },
    submit,
    isSubmitting,
    reset,
  } = useForgotPassword();
  const emailInputRef = useRef<HTMLInputElement>(null);
  const { ref: registerRef, ...emailField } = register("email");

  useEffect(() => {
    if (!open) {
      reset();
      return;
    }
    const id = setTimeout(() => emailInputRef.current?.focus(), 0);
    return () => clearTimeout(id);
  }, [open, reset]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await submit();
      toast.success("Ссылка для сброса пароля отправлена на вашу почту");
      onOpenChange(false);
    } catch {
      toast.error("Не удалось отправить ссылку");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogClose onClick={() => onOpenChange(false)} />
      <DialogHeader>
        <DialogTitle>Восстановление пароля</DialogTitle>
        <DialogDescription>
          Введите email для получения ссылки сброса.
        </DialogDescription>
      </DialogHeader>
      <DialogBody>
        <form className="space-y-6" onSubmit={handleSubmit} noValidate>
          <FormField htmlFor="forgot-password-email" label="Эл. почта">
            <Input
              id="forgot-password-email"
              ref={(el) => {
                registerRef(el);
                emailInputRef.current = el;
              }}
              type="email"
              aria-invalid={Boolean(errors.email)}
              {...emailField}
            />
            {errors.email?.message && (
              <p className="mt-1.5 text-[13px] text-red-500">
                {errors.email.message}
              </p>
            )}
          </FormField>
          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? "Отправляем..." : "Отправить ссылку"}
          </Button>
        </form>
      </DialogBody>
    </Dialog>
  );
}
