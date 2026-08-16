import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { store, User } from '../config/store.js';

export interface AuthRequest extends Request {
  user?: User;
}

const JWT_SECRET = process.env.JWT_SECRET || 'kdramabox_jwt_secret_key_2026_super_secure';

function extractToken(req: AuthRequest): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.split(' ')[1];
  }
  const cookieToken = (req as Request & { cookies?: Record<string, string> }).cookies?.access_token;
  return cookieToken || null;
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = extractToken(req);
  if (!token) {
    return res.status(401).json({ message: 'Authentication token required' });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; role: string };
    const user = store.users.find(u => u.id === decoded.id);

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    if (user.isBlocked) {
      return res.status(403).json({ message: 'Your account has been blocked by an administrator' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

export const optionalAuthMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = extractToken(req);
  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
      const user = store.users.find(u => u.id === decoded.id);
      if (user && !user.isBlocked) {
        req.user = user;
      }
    } catch (e) {
      // ignore
    }
  }
  next();
};
