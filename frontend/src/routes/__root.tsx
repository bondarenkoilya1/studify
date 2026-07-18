import * as React from "react";
import { Outlet, createRootRoute } from "@tanstack/react-router";
import { Header } from "@/shared/ui/header";

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  return (
    <React.Fragment>
      <Header />
      <main>
        <Outlet />
      </main>
    </React.Fragment>
  );
}
