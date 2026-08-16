import { authApi } from './api.js';
import { User } from '../types.js';

export interface AuthResponse {
  message: string;
  accessToken: string;
  user: User;
}

export const authService = {
  register: (name: string, email: string, password: string, confirmPassword: string) => {
    return authApi.register(name, email, password, confirmPassword);
  },

  login: (email: string, password: string) => {
    return authApi.login(email, password);
  },

  logout: () => {
    return authApi.logout();
  },

  getMe: () => {
    return authApi.getMe();
  },

  updateProfile: (name?: string, avatar?: string, bio?: string, avatarIndex?: number) => {
    return authApi.updateProfile(name, avatar, bio, avatarIndex);
  },

  changePassword: (currentPassword: string, newPassword: string, confirmPassword: string) => {
    return authApi.changePassword(currentPassword, newPassword, confirmPassword);
  }
};