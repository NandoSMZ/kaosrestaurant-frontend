import { authApi } from './api';

export const login = async (username: string, password: string): Promise<string> => {
  const response = await authApi.login(username, password);
  if (typeof window !== 'undefined') {
    localStorage.setItem('token', response.access_token);
    localStorage.setItem('user', JSON.stringify(response.user));
  }
  return response.access_token;
};

export const logout = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
};

export const getToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token');
  }
  return null;
};

export const getUser = (): { username: string } | null => {
  if (typeof window !== 'undefined') {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }
  return null;
};

export const isAuthenticated = (): boolean => {
  const token = getToken();
  if (!token) return false;
  try {
    // Decodificar payload del JWT (base64) y verificar expiración
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (payload.exp && Date.now() >= payload.exp * 1000) {
      // Token expirado — limpiar sesión
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
      return false;
    }
    return true;
  } catch {
    return false;
  }
};

export const validateToken = async (token: string): Promise<boolean> => {
  try {
    const response = await authApi.validate(token);
    return response.valid;
  } catch {
    return false;
  }
};
