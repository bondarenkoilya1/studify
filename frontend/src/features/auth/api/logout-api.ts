import { request } from "../../../shared/api/http-client.ts";

export function logoutUser() {
  return request<void>("/logout", {
    method: "POST",
  });
}
