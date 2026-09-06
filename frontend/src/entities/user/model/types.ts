export interface User {
  id: number;
  email: string;
  avatarUrl: string | null;
  isEmailVerified: boolean;
  isTotpEnabled: boolean;
}
