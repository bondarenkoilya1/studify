import { Outlet, createRootRoute } from "@tanstack/react-router";
import { Header } from "@/shared/ui/header";
import { useQuery } from "@tanstack/react-query";
import { getMe } from "@/shared/api";

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: getMe,
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Header user={user ?? null} />
      <main className="flex-1 flex flex-col">
        <Outlet />
      </main>
    </div>
  );
}
