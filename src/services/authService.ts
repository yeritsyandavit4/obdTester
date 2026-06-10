const BASE_URL = 'https://8cba-5-77-133-204.ngrok-free.app';

export interface AuthUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
}

export interface AuthResponse {
  accessToken: string;
  user: AuthUser;
}

const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body?.message ?? `Request failed (${response.status})`);
  }
  return response.json();
};

export const authRegister = async (
  firstName: string,
  lastName: string,
  email: string,
  password: string,
): Promise<AuthResponse> => {
  const response = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ firstName, lastName, email, password }),
  });
  return handleResponse(response);
};

export const authLogin = async (
  email: string,
  password: string,
): Promise<AuthResponse> => {
  const response = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return handleResponse(response);
};

export const authGetMe = async (token: string): Promise<AuthUser> => {
  const response = await fetch(`${BASE_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse(response);
};
