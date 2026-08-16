import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { store, User } from '../config/store.js';
import { AuthRequest } from '../middleware/auth.js';
import { findUserByEmail, findUserById, upsertUser, seedUsersToMongo } from '../lib/userStore.js';

const JWT_SECRET = process.env.JWT_SECRET || 'kdramabox_jwt_secret_key_2026_super_secure';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'kdramabox_refresh_secret_key_2026_super_secure';
const TARGET_ADMIN_EMAIL = 'iamzubair708@gmail.com';
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/'
};
const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 30 * 24 * 60 * 60 * 1000,
  path: '/'
};

function generateTokens(user: User) {
  const accessToken = jwt.sign(
    { id: user.id, role: user.role },
    JWT_SECRET,
    { expiresIn: '15m' }
  );
  const refreshToken = jwt.sign(
    { id: user.id, type: 'refresh' },
    JWT_REFRESH_SECRET,
    { expiresIn: '30d' }
  );
  return { accessToken, refreshToken };
}

function setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
  res.cookie('access_token', accessToken, COOKIE_OPTIONS);
  res.cookie('refresh_token', refreshToken, REFRESH_COOKIE_OPTIONS);
}

function clearAuthCookies(res: Response) {
  res.clearCookie('access_token', { ...COOKIE_OPTIONS, maxAge: 0 });
  res.clearCookie('refresh_token', { ...REFRESH_COOKIE_OPTIONS, maxAge: 0 });
}

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password, confirmPassword } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const cleanEmail = email.trim().toLowerCase();

    const existing = await findUserByEmail(cleanEmail);
    if (existing) {
      return res.status(400).json({ message: 'An account with this email already exists' });
    }

    const role = cleanEmail === TARGET_ADMIN_EMAIL.toLowerCase() ? 'admin' : 'user';
    const avatarIndex = Math.floor(Math.random() * 20);

    const passwordHash = bcrypt.hashSync(password, 10);
    const newUser: User = {
      id: `user_${Date.now()}`,
      name,
      email: cleanEmail,
      passwordHash,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
      avatarIndex,
      bio: '',
      role,
      isBlocked: false,
      watchlist: [],
      watchHistory: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString()
    };

    await upsertUser(newUser);

    const { accessToken, refreshToken } = generateTokens(newUser);
    setAuthCookies(res, accessToken, refreshToken);

    const { passwordHash: _, ...userData } = newUser;
    return res.status(201).json({
      message: 'Registration successful',
      user: userData,
      accessToken
    });
  } catch (error: unknown) {
    const err = error as Error;
    return res.status(500).json({ message: err.message || 'Server error during registration' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await findUserByEmail(cleanEmail);
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (user.isBlocked) {
      return res.status(403).json({ message: 'Your account has been blocked by an administrator' });
    }

    const isMatch = bcrypt.compareSync(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const expectedRole = cleanEmail === TARGET_ADMIN_EMAIL.toLowerCase() ? 'admin' : 'user';
    if (user.role !== expectedRole) {
      user.role = expectedRole;
    }

    user.lastLoginAt = new Date().toISOString();
    user.updatedAt = new Date().toISOString();
    await upsertUser(user);

    const { accessToken, refreshToken } = generateTokens(user);
    setAuthCookies(res, accessToken, refreshToken);

    const { passwordHash: _, ...userData } = user;
    return res.json({
      message: 'Login successful',
      user: userData,
      accessToken
    });
  } catch (error: unknown) {
    const err = error as Error;
    return res.status(500).json({ message: err.message || 'Server error during login' });
  }
};

export const logout = async (req: Request, res: Response) => {
  try {
    clearAuthCookies(res);
    return res.json({ message: 'Logged out successfully' });
  } catch (error: unknown) {
    const err = error as Error;
    return res.status(500).json({ message: err.message || 'Server error during logout' });
  }
};

export const refreshToken = async (req: Request, res: Response) => {
  try {
    const refreshToken = req.cookies?.refresh_token;
    if (!refreshToken) {
      return res.status(401).json({ message: 'Refresh token not provided' });
    }

    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as { id: string; type: string };
    if (decoded.type !== 'refresh') {
      return res.status(401).json({ message: 'Invalid token type' });
    }

    const user = await findUserById(decoded.id);
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    if (user.isBlocked) {
      return res.status(403).json({ message: 'Your account has been blocked' });
    }

    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user);
    setAuthCookies(res, accessToken, newRefreshToken);

    return res.json({ accessToken });
  } catch (error: unknown) {
    const err = error as Error;
    if (err.name === 'TokenExpiredError' || err.name === 'JsonWebTokenError') {
      clearAuthCookies(res);
      return res.status(401).json({ message: 'Session expired, please login again' });
    }
    return res.status(500).json({ message: 'Token refresh failed' });
  }
};

export const getMe = async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  const { passwordHash: _, ...userData } = req.user;
  return res.json({ user: userData });
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Not authenticated' });

    const { name, bio, avatarIndex } = req.body;
    const user = await findUserById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (name) user.name = name.trim();
    if (bio !== undefined) user.bio = bio.trim();
    if (avatarIndex !== undefined && Number.isInteger(avatarIndex) && avatarIndex >= 0 && avatarIndex < 20) {
      user.avatarIndex = avatarIndex;
      user.avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}_${avatarIndex}`;
    }

    user.updatedAt = new Date().toISOString();
    await upsertUser(user);

    const { passwordHash: _, ...userData } = user;
    return res.json({
      message: 'Profile updated successfully',
      user: userData
    });
  } catch (error: unknown) {
    const err = error as Error;
    return res.status(500).json({ message: err.message || 'Server error updating profile' });
  }
};

export const changePassword = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Not authenticated' });

    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }

    const user = await findUserById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const isMatch = bcrypt.compareSync(currentPassword, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    user.passwordHash = bcrypt.hashSync(newPassword, 10);
    user.updatedAt = new Date().toISOString();
    await upsertUser(user);

    return res.json({ message: 'Password changed successfully' });
  } catch (error: unknown) {
    const err = error as Error;
    return res.status(500).json({ message: err.message || 'Server error changing password' });
  }
};