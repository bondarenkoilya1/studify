export interface UserRequest {
  email: string;
  password: string;
  totpCode?: string;
}
