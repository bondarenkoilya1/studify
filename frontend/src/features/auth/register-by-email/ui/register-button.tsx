import { Button } from "@/shared/ui/button";

export function RegisterButton() {
  return (
    <Button
      type="button"
      variant="secondary"
      size="default"
      onClick={() => (window.location.href = "/register")}
      className="px-6"
    >
      Create account
    </Button>
  );
}
