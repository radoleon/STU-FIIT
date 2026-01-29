import { type ResponseWrapper } from 'src/misc/ResponseWrapper';
import { type AuthResponse, type LoginPayload, type RegisterPayload } from 'src/models/Auth';
import { type User } from 'src/models/User';
import { api } from 'boot/axios';
import { getErrorMessage } from 'src/misc/helpers';

export async function register(payload: RegisterPayload): Promise<ResponseWrapper<AuthResponse>> {
  try {
    const { data } = await api.post<AuthResponse>('/auth/register', payload);
    return { success: true, data };
  } catch (error: unknown) {
    return { success: false, message: getErrorMessage(error) };
  }
}

export async function login(payload: LoginPayload): Promise<ResponseWrapper<AuthResponse>> {
  try {
    const { data } = await api.post<AuthResponse>('/auth/login', payload);
    return { success: true, data };
  } catch (error: unknown) {
    return { success: false, message: getErrorMessage(error) };
  }
}

export async function logout(): Promise<ResponseWrapper<null>> {
  try {
    await api.post('/auth/logout');
    return { success: true, data: null };
  } catch (error: unknown) {
    return { success: false, message: getErrorMessage(error) };
  }
}

export async function me(token?: string): Promise<ResponseWrapper<User>> {
  try {
    const { data } = await api.get<User>(
      '/auth/me',
      token
        ? {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        : {},
    );

    return { success: true, data: data };
  } catch (error: unknown) {
    return { success: false, message: getErrorMessage(error) };
  }
}
