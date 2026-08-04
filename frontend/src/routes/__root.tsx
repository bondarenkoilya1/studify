import {
  createRootRouteWithContext,
  Link,
  Outlet,
} from "@tanstack/react-router";
import type { QueryClient } from "@tanstack/react-query";
import { Header } from "@/widgets/header";
import { ArrowLeft, Home, Search } from "lucide-react";

interface RouterContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
  notFoundComponent: NotFound,
});

function RootComponent() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 flex flex-col">
        <Outlet />
      </main>
    </div>
  );
}

function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="mx-auto flex max-w-xl flex-col items-center text-center">
        <div className="mb-6 rounded-full border bg-muted/40 p-5 shadow-sm">
          <Search className="h-10 w-10 text-muted-foreground" />
        </div>

        <h1 className="text-7xl font-extrabold tracking-tight">404</h1>

        <h2 className="mt-4 text-2xl font-semibold">Страница не найдена</h2>

        <p className="mt-3 max-w-md text-muted-foreground">
          Возможно, ссылка устарела, страница была удалена или адрес введён
          неверно.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90"
          >
            <Home className="h-4 w-4" />
            На главную
          </Link>

          <button
            onClick={() => history.back()}
            className="inline-flex items-center gap-2 rounded-lg border px-5 py-2.5 text-sm font-medium transition hover:bg-muted"
          >
            <ArrowLeft className="h-4 w-4" />
            Назад
          </button>
        </div>

        <div className="mt-12 h-px w-full bg-border" />

        <p className="mt-6 text-xs text-muted-foreground">
          Studify • Учись эффективнее
        </p>
      </div>
    </main>
  );
}
