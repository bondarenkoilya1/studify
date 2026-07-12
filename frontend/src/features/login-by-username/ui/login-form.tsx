"use client";

import { Button } from "@/shared/ui/button";
import { FormField } from "@/shared/ui/form-field";
import { Input } from "@/shared/ui/input";
import Link from "next/link";

export const LoginForm = () => {
  return (
    <div className="w-full max-w-md">
      <div className="mb-7 flex flex-col items-center sm:mb-9">
        <h1 className="text-center text-3xl font-light tracking-[-0.03em] sm:text-4xl">
          Welcome back
        </h1>

        <p className="text-studify-muted mt-3 text-center text-base sm:text-lg">
          Sign in to continue using Studify.
        </p>
      </div>

      <form className="border-studify-border bg-studify-surface shadow-studify-shadow/20 rounded-2xl border p-5 shadow-xl sm:p-8">
        <div className="space-y-5 sm:space-y-6">
          <FormField htmlFor="username" label="Username">
            <Input
              id="username"
              type="text"
              placeholder="octocat"
              autoComplete="username"
              controlSize="large"
            />
          </FormField>

          <FormField htmlFor="password" label="Password">
            <Input
              id="password"
              type="password"
              placeholder="Your password"
              autoComplete="current-password"
              controlSize="large"
            />
          </FormField>

          <Button className="w-full" controlSize="large" type="submit">
            Sign in
          </Button>
        </div>

        <div className="mt-6 text-center text-sm">
          <span className="text-studify-muted">Don't have an account? </span>

          <Link href="/register" className="font-medium transition-colors hover:underline">
            Create one
          </Link>
        </div>
      </form>
    </div>
  );
};
