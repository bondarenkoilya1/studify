import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({ component: HomePage });

function HomePage() {
  return (
    <main className="grid min-h-screen place-items-center bg-studify-canvas p-6 text-studify-text"></main>
  );
}
