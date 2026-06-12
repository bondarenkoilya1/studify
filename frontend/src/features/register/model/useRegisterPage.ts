import { type ChangeEvent, type FormEvent, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { type User } from "../../../entities/user/types.ts";
import { getErrorMessage } from "../../../shared/lib/errors.ts";
import { registerUser } from "../api/register-api.ts";

const maxBcryptPasswordLength = 72;

export function useRegisterPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [createdUser, setCreatedUser] = useState<User | null>(null);
  const [error, setError] = useState("");

  const registerUserMutation = useMutation({
    mutationFn: registerUser,
  });

  const passwordLength = password.length;
  const isPasswordTooLong = passwordLength > maxBcryptPasswordLength;
  function handleUsernameChange(event: ChangeEvent<HTMLInputElement>) {
    setUsername(event.target.value);
    setCreatedUser(null);
    setError("");
  }

  function handlePasswordChange(event: ChangeEvent<HTMLInputElement>) {
    setPassword(event.target.value);
    setCreatedUser(null);
    setError("");
  }

  function handleConfirmPasswordChange(event: ChangeEvent<HTMLInputElement>) {
    setConfirmPassword(event.target.value);
    setCreatedUser(null);
    setError("");
  }

  async function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setCreatedUser(null);
    setError("");

    if (!username.trim() || !password.trim()) {
      setError("Username and password are required.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (isPasswordTooLong) {
      setError("Password must be 72 characters or fewer.");
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
      setConfirmPassword("");
    } catch (requestError) {
      setError(getErrorMessage(requestError).trim() || "Failed to register user.");
    }
  }

  return {
    confirmPassword,
    createdUser,
    error,
    handleConfirmPasswordChange,
    handlePasswordChange,
    handleRegister,
    handleUsernameChange,
    isSubmitting: registerUserMutation.isPending,
    password,
    passwordLength,
    username,
  };
}
