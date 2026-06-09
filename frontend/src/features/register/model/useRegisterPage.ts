import { type FormEvent, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { type User } from "../../../entities/user/types.ts";
import { getErrorMessage } from "../../../shared/lib/errors.ts";
import { registerUser } from "../api/register-api.ts";

export function useRegisterPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [createdUser, setCreatedUser] = useState<User | null>(null);
  const [error, setError] = useState("");

  const registerUserMutation = useMutation({
    mutationFn: registerUser,
  });

  async function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setCreatedUser(null);
    setError("");

    if (!username.trim() || !password.trim()) {
      setError("Username and secret code are required.");
      return;
    }

    try {
      const user = await registerUserMutation.mutateAsync({
        username: username.trim(),
        password,
      });

      setCreatedUser(user);
      setUsername("");
      setPassword("");
    } catch (requestError) {
      setError(getErrorMessage(requestError) || "Failed to register user.");
    }
  }

  return {
    createdUser,
    error,
    handleRegister,
    isSubmitting: registerUserMutation.isPending,
    password,
    setPassword,
    setUsername,
    username,
  };
}
