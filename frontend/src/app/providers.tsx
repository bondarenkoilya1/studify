import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import { router } from "@/router";
import { queryClient } from "@/shared/api";
import { Toaster } from "@/shared/ui/sonner";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

export function Providers() {
  return (
    <QueryClientProvider client={queryClient}>
      <Toaster />
      <RouterProvider router={router} />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
