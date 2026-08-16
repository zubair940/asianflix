import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { store, User } from '../config/store.js';
import { AuthRequest } from '../middleware/auth.js';

const JWT_SECRET = process.env.JWT_SECRET || 'kdramabox_jwt_secret_key_2026_super_secure';
const TARGET_ADMIN_EMAIL = 'iamzubair708@gmail.com';

export const register = (req: Request, res: Response) => {
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

    const existing = store.users.find(u => u.email.toLowerCase() === cleanEmail);
    if (existing) {
      return res.status(400).json({ message: 'An account with this email already exists' });
    }

    // Role assignment strictly based on email
    const role = cleanEmail === TARGET_ADMIN_EMAIL.toLowerCase() ? 'admin' : 'user';

    const passwordHash = bcrypt.hashSync(password, 10);
    const newUser: User = {
      id: `user_${Date.now()}`,
      name,
      email: cleanEmail,
      passwordHash,
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name)}`,
      role,
      isBlocked: false,
      watchlist: [],
      createdAt: new Date().toISOString()
    };

    store.users.push(newUser);
    store.saveUsers();

    const token = jwt.sign({ id: newUser.id, role: newUser.role }, JWT_SECRET, { expiresIn: '7d' });

    const { passwordHash: _, ...userData } = newUser;
    return res.status(201).json({
      message: 'Registration successful',
      token,
      user: userData
    });
  } catch (error: any) {
    return res.status(500).json({ message: error.message || 'Server error during registration' });
  }
};

export const login = (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = store.users.find(u => u.email.toLowerCase() === cleanEmail);
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

    // Ensure role is dynamically synced based on email
    const expectedRole = cleanEmail === TARGET_ADMIN_EMAIL.toLowerCase() ? 'admin' : 'user';
    if (user.role !== expectedRole) {
      user.role = expectedRole;
      store.saveUsers();
    }

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    const { passwordHash: _, ...userData } = user;
    return res.json({
      message: 'Login successful',
      token,
      user: userData
    });
  } catch (error: any) {
    return res.status(500).json({ message: error.message || 'Server error during login' });
  }
};

export const getMe = (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  const { passwordHash: _, ...userData } = req.user;
  return res.json({ user: userData });
};

export const updateProfile = (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Not authenticated' });

    const { name, avatar } = req.body;
    const userIndex = store.users.findIndex(u => u.id === req.user!.id);

    if (userIndex === -1) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (name) store.users[userIndex].name = name;
    if (avatar) store.users[userIndex].avatar = avatar;

    store.saveUsers();

    const { passwordHash: _, ...userData } = store.users[userIndex];
    return res.json({
      message: 'Profile updated successfully',
      user: userData
    });
  } catch (error: any) {
    return res.status(500).json({ message: error.message || 'Server error updating profile' });
  }
};
