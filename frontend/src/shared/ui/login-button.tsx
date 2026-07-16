"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/shared/ui/button";

export function LoginButton() {
  const router = useRouter();

  const handleClick = () => {
    router.push("/login");
  };

  return (
    <Button
      type="button"
      variant="primary"
      controlSize="medium"
      onClick={handleClick}
      className="px-6"
    >
      Sign in
    </Button>
  );
}
