import { Button } from "@/shared/ui/button";

export function LoginButton() {
  return (
    <Button
      type="button"
      variant="primary"
      size="default"
      onClick={() => (window.location.href = "/login")}
      className="px-6"
    >
      Войти
    </Button>
  );
}
