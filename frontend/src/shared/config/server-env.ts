import { z } from "zod";

const schema = z.object({
  API_INTERNAL_BASE_URL: z.url(),
});

const env = schema.parse({
  API_INTERNAL_BASE_URL: process.env.API_INTERNAL_BASE_URL,
});

export const serverEnv = {
  apiBaseUrl: env.API_INTERNAL_BASE_URL.replace(/\/$/, ""),
};
