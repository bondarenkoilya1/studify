import { Link } from "@tanstack/react-router";

export function HeaderLogo({ signedIn }: { signedIn: boolean }) {
  return (
    <Link
      to={signedIn ? "/dashboard" : "/"}
      className="inline-flex min-h-11 shrink-0 items-center rounded-sm text-xl font-bold tracking-tight text-studify-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-studify-active sm:text-2xl"
    >
      Studify
    </Link>
  );
}
