import { Request, Response } from 'express';
import { User } from '../models/User';
import { Restaurant } from '../models/Restaurant';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { sendSuccess, sendError } from '../utils/response';
import { AuthRequest } from '../types';

export const register = async (req: Request, res: Response): Promise<void> => {
  const { name, email, password, role, restaurantId } = req.body;

  const existing = await User.findOne({ email });
  if (existing) {
    sendError(res, 'Email already in use', 409);
    return;
  }

  if (role === 'restaurant_admin' || role === 'staff') {
    if (!restaurantId) {
      sendError(res, 'restaurantId required for this role');
      return;
    }
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      sendError(res, 'Restaurant not found', 404);
      return;
    }
  }

  const user = await User.create({ name, email, password, role, restaurantId });

  const payload = { userId: user._id.toString(), role: user.role, restaurantId: user.restaurantId?.toString() };
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  sendSuccess(res, { user, accessToken, refreshToken }, 'Registration successful', 201);
};

export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  const user = await User.findOne({ email, isActive: true }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    sendError(res, 'Invalid email or password', 401);
    return;
  }

  user.lastLogin = new Date();
  await user.save();

  const payload = { userId: user._id.toString(), role: user.role, restaurantId: user.restaurantId?.toString() };
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  const userData = user.toJSON();
  sendSuccess(res, { user: userData, accessToken, refreshToken }, 'Login successful');
};

export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  const { refreshToken: token } = req.body;
  if (!token) {
    sendError(res, 'Refresh token required', 400);
    return;
  }

  try {
    const payload = verifyRefreshToken(token);
    const user = await User.findById(payload.userId);
    if (!user || !user.isActive) {
      sendError(res, 'User not found or inactive', 401);
      return;
    }

    const newPayload = { userId: user._id.toString(), role: user.role, restaurantId: user.restaurantId?.toString() };
    const accessToken = generateAccessToken(newPayload);
    const refreshToken = generateRefreshToken(newPayload);

    sendSuccess(res, { accessToken, refreshToken }, 'Token refreshed');
  } catch {
    sendError(res, 'Invalid refresh token', 401);
  }
};

export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  const user = await User.findById(req.user!.userId).populate('restaurantId');
  if (!user) {
    sendError(res, 'User not found', 404);
    return;
  }
  sendSuccess(res, user, 'User profile');
};

export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  const { name } = req.body;
  const user = await User.findByIdAndUpdate(req.user!.userId, { name }, { new: true, runValidators: true });
  sendSuccess(res, user, 'Profile updated');
};

export const changePassword = async (req: AuthRequest, res: Response): Promise<void> => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user!.userId).select('+password');
  if (!user || !(await user.comparePassword(currentPassword))) {
    sendError(res, 'Current password is incorrect', 400);
    return;
  }
  user.password = newPassword;
  await user.save();
  sendSuccess(res, null, 'Password changed successfully');
};
