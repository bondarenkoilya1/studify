import { AuthProvider } from "@/shared/providers/auth-provider";
import { User } from "@/entities/user";
import { ReactNode } from "react";

type ProvidersProps = {
  children: ReactNode;
  user: User | null;
};

export function Providers({ children, user }: ProvidersProps) {
  return <AuthProvider initialUser={user}>{children}</AuthProvider>;
}
