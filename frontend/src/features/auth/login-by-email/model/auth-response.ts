import type { User } from "@/entities/user";

export type LoginChallengeResponse = {
  challengeToken: string;
};

export type LoginResponse = User | LoginChallengeResponse;

export function isLoginChallenge(
  response: LoginResponse,
): response is LoginChallengeResponse {
  return "challengeToken" in response;
}
