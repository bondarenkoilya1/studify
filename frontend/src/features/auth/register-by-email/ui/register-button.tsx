import { Link } from "@tanstack/react-router";
import { buttonVariants } from "@/shared/ui/button";
import { cn } from "@/shared/lib/cn";

export function RegisterButton() {
  return (
    <Link
      to="/register"
      className={cn(
        buttonVariants({ variant: "secondary", size: "default" }),
        "min-h-11 px-3 sm:px-4",
      )}
    >
      Создать аккаунт
    </Link>
  );
}
