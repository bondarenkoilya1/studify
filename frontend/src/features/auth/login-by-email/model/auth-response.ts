import type { ChallengeTokenResponse, User } from "@/shared/api";

export function isLoginChallenge(
  response: User | ChallengeTokenResponse,
): response is ChallengeTokenResponse {
  return "challenge_token" in response;
}
