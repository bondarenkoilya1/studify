import { Link } from "@tanstack/react-router";
import { buttonVariants } from "@/shared/ui/button";
import { cn } from "@/shared/lib/cn";

export function LoginButton() {
  return (
    <Link
      to="/login"
      className={cn(buttonVariants({ variant: "ghost", size: "default" }), "min-h-11 px-3 sm:px-4")}
    >
      Войти
    </Link>
  );
}
