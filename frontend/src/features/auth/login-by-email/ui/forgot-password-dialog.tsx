import { useEffect, useRef } from "react";
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

import { useForgotPassword } from "../model/use-forgot-password";
import { toast } from "react-toastify";

type ForgotPasswordDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ForgotPasswordDialog({
  open,
  onOpenChange,
}: ForgotPasswordDialogProps) {
  const {
    register,
    formState: { errors },
    submit,
    isSubmitting,
  } = useForgotPassword();

  const emailInputRef = useRef<HTMLInputElement>(null);
  const { ref: registerRef, ...emailField } = register("email");

  useEffect(() => {
    if (!open) return;

    // setTimeout, а не rAF: Dialog фокусит свой контейнер через rAF при
    // открытии, и если тут тоже использовать rAF, эффект контейнера может
    // отработать позже (React коммитит эффекты детей раньше родителя) и
    // перебить фокус инпута. setTimeout гарантированно выполнится следующим
    // макротаском — уже после того как Dialog отфокусит контейнер.
    const id = setTimeout(() => {
      emailInputRef.current?.focus();
    }, 0);

    return () => clearTimeout(id);
  }, [open]);

  const handleSubmit = async () => {
    try {
      await submit();
      toast.success("Ссылка для сброса пароля отправлена на вашу почту");
      onOpenChange(false);
    } catch {}
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogClose onClick={() => onOpenChange(false)} />

      <DialogHeader>
        <DialogTitle>Восстановление пароля</DialogTitle>

        <DialogDescription>
          Введите адрес электронной почты, и мы отправим ссылку для сброса
          пароля.
        </DialogDescription>
      </DialogHeader>

      <DialogBody>
        <form className="space-y-6" onSubmit={handleSubmit}>
          <FormField htmlFor="forgot-password-email" label="Эл. почта">
            <Input
              id="forgot-password-email"
              ref={(el) => {
                registerRef(el);
                emailInputRef.current = el;
              }}
              type="email"
              placeholder="octocat@gmail.com"
              autoComplete="email"
              size="lg"
              aria-invalid={Boolean(errors.email)}
              aria-describedby={
                errors.email ? "forgot-password-email-error" : undefined
              }
              {...emailField}
            />

            {errors.email?.message && (
              <p
                id="forgot-password-email-error"
                className="mt-1.5 text-[13px] leading-snug text-red-500"
              >
                {errors.email.message}
              </p>
            )}
          </FormField>

          <Button
            type="submit"
            size="lg"
            disabled={isSubmitting}
            className="h-12 w-full rounded-xl bg-studify-primary text-[15px] font-medium text-white transition-colors duration-200 hover:bg-studify-hover active:bg-studify-active"
          >
            {isSubmitting ? "Отправляем..." : "Отправить ссылку"}
          </Button>
        </form>
      </DialogBody>
    </Dialog>
  );
}
