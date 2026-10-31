import { Link } from "@tanstack/react-router";
import { buttonVariants } from "@/shared/ui/button";
import { cn } from "@/shared/lib/cn";

export function RegisterButton() {
  return (
    <Link
      to="/register"
      className={cn(buttonVariants({ variant: "secondary", size: "default" }), "px-6")}
    >
      Create account
    </Link>
  );
}
