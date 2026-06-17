import { type ChangeEvent, type FormEvent, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/model/auth-context.tsx";
import { getErrorMessage } from "../../../shared/lib/errors.ts";
import { loginUser } from "../api/login-api.ts";

export function useLoginPage() {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const loginUserMutation = useMutation({
    mutationFn: loginUser,
  });

  function handleUsernameChange(event: ChangeEvent<HTMLInputElement>) {
    setUsername(event.target.value);
    setError("");
  }

  function handlePasswordChange(event: ChangeEvent<HTMLInputElement>) {
    setPassword(event.target.value);
    setError("");
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const trimmedUsername = username.trim();
    if (!trimmedUsername || !password.trim()) {
      setError("Username and password are required.");
      return;
    }

    try {
      await loginUserMutation.mutateAsync({
        username: trimmedUsername,
        password,
      });

      setUser({ username: trimmedUsername });
      navigate("/dashboard");
    } catch (requestError) {
      setError(getErrorMessage(requestError).trim() || "Failed to log in.");
    }
  }

  return {
    error,
    handleLogin,
    handlePasswordChange,
    handleUsernameChange,
    isSubmitting: loginUserMutation.isPending,
    password,
    username,
  };
}
