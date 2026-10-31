import { Link } from "@tanstack/react-router";
import { buttonVariants } from "@/shared/ui/button";
import { cn } from "@/shared/lib/cn";

export function LoginButton() {
  return (
    <Link
      to="/login"
      className={cn(buttonVariants({ variant: "primary", size: "default" }), "px-6")}
    >
      Войти
    </Link>
  );
}
