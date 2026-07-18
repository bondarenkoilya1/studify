import { z } from "zod";

const schema = z.object({
  VITE_API_URL: z.url(),
});

const env = schema.parse({
  VITE_API_URL: import.meta.env.VITE_API_URL,
});

export const publicEnv = {
  apiBaseUrl: env.VITE_API_URL.replace(/\/$/, ""),
};
