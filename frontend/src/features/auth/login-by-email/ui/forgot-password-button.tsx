import { Button } from "@/shared/ui/button";

type ForgotPasswordButtonProps = {
  onClick: () => void;
};

export function ForgotPasswordButton({ onClick }: ForgotPasswordButtonProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="default"
      onClick={onClick}
      className="min-h-0 px-0 py-0 text-[13px] font-medium cursor-pointer"
    >
      Забыли пароль?
    </Button>
  );
}
