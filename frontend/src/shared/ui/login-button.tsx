import { Button } from "@/shared/ui/button";

export function LoginButton() {
  return (
    <Button
      type="button"
      variant="primary"
      controlSize="medium"
      onClick={() => (window.location.href = "/login")}
      className="px-6"
    >
      Sign in
    </Button>
  );
}
