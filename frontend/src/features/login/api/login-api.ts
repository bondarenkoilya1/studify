import { type LoginUserPayload } from "../../../entities/user/types.ts";
import { request } from "../../../shared/api/http-client.ts";

export function loginUser(user: LoginUserPayload) {
  return request<void>("/login", {
    method: "POST",
    body: JSON.stringify(user),
  });
}
