import { request } from "./request";

const createMethod =
  (method: RequestInit["method"]) =>
  <T>(
    url: string,
    body?: unknown,
    options?: Omit<RequestInit, "method" | "body">,
  ) =>
    request<T>(url, {
      ...options,
      method,
      body: body as any,
    });

export const httpClient = {
  get: <T>(url: string, options?: Omit<RequestInit, "method" | "body">) =>
    request<T>(url, { ...options, method: "GET" }),

  post: createMethod("POST"),
  patch: createMethod("PATCH"),
  delete: createMethod("DELETE"),
};