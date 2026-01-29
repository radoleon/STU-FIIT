import { type User } from 'src/models/User';

export interface RegisterPayload {
  firstName: string;
  lastName: string;
  nickname: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}
