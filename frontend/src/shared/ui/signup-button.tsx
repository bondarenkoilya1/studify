"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/shared/ui/button";

export function SignupButton() {
  const router = useRouter();

  const handleClick = () => {
    router.push("/register");
  };

  return (
    <Button
      type="button"
      variant="secondary"
      controlSize="medium"
      onClick={handleClick}
      className="px-6"
    >
      Create account
    </Button>
  );
}
