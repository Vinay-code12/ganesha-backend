import { Response } from 'express';
import { Restaurant } from '../models/Restaurant';
import { User } from '../models/User';
import { Subscription } from '../models/Other';
import { sendSuccess, sendError } from '../utils/response';
import { paginate, buildPaginationMeta } from '../utils/helpers';
import { AuthRequest } from '../types';

export const createRestaurant = async (req: AuthRequest, res: Response): Promise<void> => {
  const { name, address, phone, email, cuisine, subscriptionPlan, adminEmail, adminName, adminPassword } = req.body;

  const existing = await Restaurant.findOne({ email });
  if (existing) {
    sendError(res, 'Restaurant with this email already exists', 409);
    return;
  }

  if (adminEmail && adminName && adminPassword) {
    const existingUser = await User.findOne({ email: adminEmail });
    if (existingUser) {
      sendError(res, 'Admin email already in use', 409);
      return;
    }
  }

  const restaurant = await Restaurant.create({ name, address, phone, email, cuisine, subscriptionPlan });

  // Create admin user
  if (adminEmail && adminName && adminPassword) {
    const admin = await User.create({
      name: adminName,
      email: adminEmail,
      password: adminPassword,
      role: 'restaurant_admin',
      restaurantId: restaurant._id,
    });
    restaurant.adminId = admin._id;
    await restaurant.save();
  }

  // Create subscription
  const planPrices = { starter: 49, professional: 149, enterprise: 499 };
  await Subscription.create({
    restaurantId: restaurant._id,
    plan: subscriptionPlan || 'starter',
    status: 'trial',
    startDate: new Date(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    amount: planPrices[subscriptionPlan as keyof typeof planPrices] || 49,
    billingCycle: 'monthly',
  });

  const populated = await Restaurant.findById(restaurant._id).populate('adminId', 'name email');
  sendSuccess(res, populated, 'Restaurant created successfully', 201);
};

export const getAllRestaurants = async (req: AuthRequest, res: Response): Promise<void> => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const { status, subscriptionPlan, search } = req.query;

  const filter: Record<string, unknown> = {};
  if (status) filter.status = status;
  if (subscriptionPlan) filter.subscriptionPlan = subscriptionPlan;
  if (search) filter.name = { $regex: search, $options: 'i' };

  const [restaurants, total] = await Promise.all([
    Restaurant.find(filter)
      .populate('adminId', 'name email')
      .sort({ createdAt: -1 })
      .skip(paginate(page, limit).skip)
      .limit(limit),
    Restaurant.countDocuments(filter),
  ]);

  sendSuccess(res, restaurants, 'Restaurants retrieved', 200, buildPaginationMeta(total, page, limit));
};

export const getRestaurant = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  
  // Restaurant admins can only access their own
  if (req.user!.role !== 'super_admin' && req.user!.restaurantId !== id) {
    sendError(res, 'Access denied', 403);
    return;
  }

  const restaurant = await Restaurant.findById(id).populate('adminId', 'name email');
  if (!restaurant) {
    sendError(res, 'Restaurant not found', 404);
    return;
  }
  sendSuccess(res, restaurant, 'Restaurant retrieved');
};

export const updateRestaurant = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  if (req.user!.role !== 'super_admin' && req.user!.restaurantId !== id) {
    sendError(res, 'Access denied', 403);
    return;
  }

  const restaurant = await Restaurant.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
  if (!restaurant) {
    sendError(res, 'Restaurant not found', 404);
    return;
  }
  sendSuccess(res, restaurant, 'Restaurant updated');
};

export const updateRestaurantStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { status } = req.body;

  const restaurant = await Restaurant.findByIdAndUpdate(id, { status }, { new: true });
  if (!restaurant) {
    sendError(res, 'Restaurant not found', 404);
    return;
  }
  sendSuccess(res, restaurant, `Restaurant ${status}`);
};

export const deleteRestaurant = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const restaurant = await Restaurant.findByIdAndDelete(id);
  if (!restaurant) {
    sendError(res, 'Restaurant not found', 404);
    return;
  }
  sendSuccess(res, null, 'Restaurant deleted');
};

export const getMyRestaurant = async (req: AuthRequest, res: Response): Promise<void> => {
  const restaurant = await Restaurant.findById(req.user!.restaurantId);
  if (!restaurant) {
    sendError(res, 'Restaurant not found', 404);
    return;
  }
  sendSuccess(res, restaurant, 'Restaurant retrieved');
};
