import { QueryClient } from "@tanstack/react-query";
import { reactQueryConfig } from "@/shared/config/react-query-config";

export const queryClient = new QueryClient(reactQueryConfig);
