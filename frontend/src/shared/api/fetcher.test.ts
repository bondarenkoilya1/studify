import { afterEach, expect, it, vi } from "vitest";
import { fetcher } from "./fetcher";

afterEach(() => vi.unstubAllGlobals());

it("shares one refresh across simultaneous 401s", async () => {
  let signedIn = false;
  const fetch = vi.fn(async (url: string) => {
    if (url.endsWith("/api/auth/refresh")) {
      await new Promise((resolve) => setTimeout(resolve, 0));
      signedIn = true;
      return new Response(null, { status: 204 });
    }
    return signedIn
      ? Response.json({ loaded: true })
      : new Response("unauthorized", { status: 401 });
  });
  vi.stubGlobal("fetch", fetch);

  await expect(
    Promise.all([fetcher("/api/subjects"), fetcher("/api/tasks")]),
  ).resolves.toEqual([{ loaded: true }, { loaded: true }]);
  expect(
    fetch.mock.calls.filter(([url]) => url.endsWith("/api/auth/refresh")),
  ).toHaveLength(1);
});

it("returns an anonymous session without attempting refresh", async () => {
  const fetch = vi
    .fn()
    .mockResolvedValue(Response.json({ authenticated: false }));
  vi.stubGlobal("fetch", fetch);
  await expect(fetcher("/api/auth/session")).resolves.toEqual({
    authenticated: false,
  });
  expect(fetch).toHaveBeenCalledTimes(1);
});

it("preserves Retry-After on authentication quotas", async () => {
  const fetch = vi.fn().mockResolvedValue(
    new Response("too many requests", {
      status: 429,
      headers: { "Retry-After": "23" },
    }),
  );
  vi.stubGlobal("fetch", fetch);
  await expect(fetcher("/api/auth/login")).rejects.toMatchObject({
    status: 429,
    retryAfter: 23,
  });
  expect(fetch).toHaveBeenCalledTimes(1);
});
