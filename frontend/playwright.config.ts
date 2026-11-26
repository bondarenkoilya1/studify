import { defineConfig } from "@playwright/test";

const webUrl = new URL(process.env.E2E_WEB_URL ?? "http://localhost:5173");
const apiUrl = process.env.E2E_API_URL ?? "http://localhost:8080";

export default defineConfig({
  testDir: "./e2e",
  timeout: 45_000,
  workers: 1,
  use: {
    baseURL: webUrl.origin,
    browserName: "chromium",
    timezoneId: "UTC",
    trace: "retain-on-failure",
  },
  webServer: {
    command: `bun run dev --host 127.0.0.1 --port ${webUrl.port || 5173} --strictPort`,
    env: { VITE_API_URL: apiUrl },
    url: webUrl.origin,
    reuseExistingServer: !process.env.CI,
  },
});
