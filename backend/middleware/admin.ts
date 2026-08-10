import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.js';

const TARGET_ADMIN_EMAIL = 'iamzubair708@gmail.com';

export const adminMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (
    !req.user ||
    req.user.role !== 'admin' ||
    req.user.email.toLowerCase() !== TARGET_ADMIN_EMAIL.toLowerCase()
  ) {
    return res.status(403).json({
      message: `Access denied: Admin privileges restricted to ${TARGET_ADMIN_EMAIL}`
    });
  }
  next();
};
