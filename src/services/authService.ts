import { apiRequest } from './api.js';
import { User } from '../types.js';

export interface AuthResponse {
  message: string;
  token: string;
  user: User;
}

export const authService = {
  register: (name: string, email: string, password: string, confirmPassword: string) => {
    return apiRequest<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, confirmPassword })
    });
  },

  login: (email: string, password: string) => {
    return apiRequest<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
  },

  getMe: () => {
    return apiRequest<{ user: User }>('/auth/me');
  },

  updateProfile: (name?: string, avatar?: string) => {
    return apiRequest<{ message: string; user: User }>('/auth/update', {
      method: 'PUT',
      body: JSON.stringify({ name, avatar })
    });
  }
};
