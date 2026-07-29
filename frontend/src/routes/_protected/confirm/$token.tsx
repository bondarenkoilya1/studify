import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";
import { confirmEmail } from "@/features/confirm-email";
import { queryClient } from "@/shared/api";

export const Route = createFileRoute("/_protected/confirm/$token")({
  loader: async ({ params }) => {
    await confirmEmail(params.token);

    queryClient.setQueryData(["user"], (old) => {
      if (!old) return old;

      return {
        ...old,
        is_email_verified: true,
      };
    });

    return {
      success: true,
    };
  },

  component: RouteComponent,
});

function RouteComponent() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-4">
      <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-8 text-center shadow-xl">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10">
          <CheckCircle2 className="h-9 w-9 text-emerald-500" />
        </div>

        <h1 className="mb-3 text-2xl font-semibold text-white">
          Email confirmed
        </h1>

        <p className="mb-8 text-sm leading-relaxed text-zinc-400">
          Your email address has been successfully verified. You can now use all
          features of your account.
        </p>

        <Link
          to="/"
          className="inline-flex w-full items-center justify-center rounded-xl bg-white px-4 py-3 text-sm font-medium text-zinc-900 transition hover:bg-zinc-200"
        >
          Continue to app
        </Link>
      </div>
    </main>
  );
}
