export type User = {
  id: number;
  username: string;
};

export type RegisterUserPayload = {
  username: string;
  password: string;
};

export type LoginUserPayload = {
  username: string;
  password: string;
};
