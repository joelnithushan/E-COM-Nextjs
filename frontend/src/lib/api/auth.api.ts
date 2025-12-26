import apiClient from './client';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'CUSTOMER';
  phone?: string;
  avatar?: string;
  isEmailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  success: boolean;
  data: {
    user: User;
    accessToken: string;
    refreshToken?: string;
  };
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  phone?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface RefreshTokenResponse {
  success: boolean;
  data: {
    accessToken: string;
  };
}

/**
 * Register new user
 */
export const register = async (data: RegisterData): Promise<AuthResponse> => {
  return apiClient.post('/auth/register', data);
};

/**
 * Login user
 */
export const login = async (data: LoginData): Promise<AuthResponse> => {
  return apiClient.post('/auth/login', data);
};

/**
 * Logout user
 */
export const logout = async (): Promise<{ success: boolean }> => {
  return apiClient.post('/auth/logout');
};

/**
 * Refresh access token
 */
export const refreshToken = async (): Promise<RefreshTokenResponse> => {
  return apiClient.post('/auth/refresh');
};

/**
 * Get current user
 */
export const getCurrentUser = async (): Promise<{
  success: boolean;
  data: { user: User };
}> => {
  return apiClient.get('/auth/me');
};




