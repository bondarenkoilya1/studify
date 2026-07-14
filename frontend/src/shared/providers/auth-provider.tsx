"use client";

import type { User } from "@/entities/user";
import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type AuthStatus = "idle" | "loading" | "authenticated" | "error";

interface AuthContextValue {
  user: User | null;
  status: AuthStatus;
  setAuthenticatedUser: (user: User) => void;
  setLoading: () => void;
  setError: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

type AuthProviderProps = {
  children: ReactNode;
  initialUser: User | null;
};

export function AuthProvider({ children, initialUser }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(initialUser);
  const [status, setStatus] = useState<AuthStatus>(
    initialUser ? "authenticated" : "idle"
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      status,

      setAuthenticatedUser(user) {
        setUser(user);
        setStatus("authenticated");
      },

      setLoading() {
        setStatus("loading");
      },

      setError() {
        setUser(null);
        setStatus("error");
      },
    }),
    [user, status],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
