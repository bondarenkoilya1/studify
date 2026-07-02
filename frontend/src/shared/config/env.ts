import { z } from "zod";

const publicEnvSchema = z.object({
  NEXT_PUBLIC_API_BASE_URL: z.url(),
});

const publicEnv = publicEnvSchema.parse({
  NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
});

export const env = {
  apiBaseUrl: publicEnv.NEXT_PUBLIC_API_BASE_URL.replace(/\/$/, ""),
} as const;
