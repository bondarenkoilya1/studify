import { createContext, type ReactNode, useContext, useMemo, useState } from "react";

type AuthUser = {
  username: string;
};

type StoredAuthUser = {
  version: 1;
  user: AuthUser;
};

type AuthContextValue = {
  user: AuthUser | null;
  setUser: (user: AuthUser) => void;
  clearUser: () => void;
};

const authStorageKey = "studify.auth.user";

const AuthContext = createContext<AuthContextValue | null>(null);

function readStoredUser() {
  try {
    const rawUser = window.localStorage.getItem(authStorageKey);
    if (!rawUser) {
      return null;
    }

    const storedUser = JSON.parse(rawUser) as Partial<StoredAuthUser>;
    if (storedUser.version !== 1 || !storedUser.user?.username) {
      return null;
    }

    return {
      username: storedUser.user.username,
    };
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setAuthUser] = useState<AuthUser | null>(() => readStoredUser());

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      setUser(nextUser) {
        const storedUser: StoredAuthUser = {
          version: 1,
          user: nextUser,
        };

        window.localStorage.setItem(authStorageKey, JSON.stringify(storedUser));
        setAuthUser(nextUser);
      },
      clearUser() {
        window.localStorage.removeItem(authStorageKey);
        setAuthUser(null);
      },
    }),
    [user],
  );

  return <AuthContext value={value}>{children}</AuthContext>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return value;
}
