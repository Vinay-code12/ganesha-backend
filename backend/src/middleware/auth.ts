import { Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { sendError } from '../utils/response';
import { AuthRequest, UserRole } from '../types';

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    sendError(res, 'Access token required', 401);
    return;
  }

  const token = authHeader.substring(7);
  try {
    const payload = verifyAccessToken(token);
    req.user = {
      userId: payload.userId,
      role: payload.role,
      restaurantId: payload.restaurantId,
    };
    next();
  } catch {
    sendError(res, 'Invalid or expired token', 401);
  }
};

export const authorize = (...roles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, 'Not authenticated', 401);
      return;
    }
    if (!roles.includes(req.user.role)) {
      sendError(res, 'Insufficient permissions', 403);
      return;
    }
    next();
  };
};

export const authorizeRestaurant = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (!req.user) {
    sendError(res, 'Not authenticated', 401);
    return;
  }

  // Super admin bypasses restaurant check
  if (req.user.role === 'super_admin') {
    next();
    return;
  }

  const restaurantId = req.params.restaurantId || req.body.restaurantId;
  
  if (restaurantId && req.user.restaurantId !== restaurantId) {
    sendError(res, 'Access denied to this restaurant', 403);
    return;
  }

  next();
};

export const isSuperAdmin = authorize('super_admin');
export const isRestaurantAdmin = authorize('restaurant_admin');
export const isStaffOrAbove = authorize('staff', 'restaurant_admin', 'super_admin');
export const isAdminOrAbove = authorize('restaurant_admin', 'super_admin');
