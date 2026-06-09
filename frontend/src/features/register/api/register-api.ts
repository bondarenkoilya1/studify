import { type RegisterUserPayload, type User } from "../../../entities/user/types.ts";
import { request } from "../../../shared/api/http-client.ts";

export function registerUser(user: RegisterUserPayload) {
  return request<User>("/register/", {
    method: "POST",
    body: JSON.stringify(user),
  });
}
