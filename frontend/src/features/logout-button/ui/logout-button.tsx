"use client";

import { useState } from "react";
import { cn } from "@/shared/lib/cn";
import { logout } from "@/features/logout-button";

export function LogoutButton() {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    if (loading) return;
    setLoading(true);
    try {
      await logout();
    } catch (err) {
      console.error("Logout failed", err);
      // TODO: show error in a toast when a toast/toastify library is added to the project
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      aria-label="Log out"
      className={cn(
        "block w-full px-4 py-2 text-left text-sm font-medium text-red-500",
        "bg-studify-surface hover:bg-studify-field transition-colors rounded-lg",
        loading ? "opacity-50 cursor-not-allowed" : "",
      )}
    >
      {loading ? "Logging out..." : "Log out"}
    </button>
  );
}
