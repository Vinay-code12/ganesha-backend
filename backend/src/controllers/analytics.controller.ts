import { Response } from 'express';
import { Order } from '../models/Order';
import { Booking } from '../models/Booking';
import { Restaurant } from '../models/Restaurant';
import { Customer } from '../models/Other';
import { sendSuccess } from '../utils/response';
import { AuthRequest } from '../types';

export const getSuperAdminDashboard = async (req: AuthRequest, res: Response): Promise<void> => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const [
    totalRestaurants,
    activeRestaurants,
    totalOrdersToday,
    monthlyRevenue,
    revenueByMonth,
    topRestaurants,
    restaurantsByPlan,
  ] = await Promise.all([
    Restaurant.countDocuments(),
    Restaurant.countDocuments({ status: 'active' }),
    Order.countDocuments({ createdAt: { $gte: today }, status: { $ne: 'cancelled' } }),
    Order.aggregate([
      { $match: { createdAt: { $gte: thisMonth }, status: { $ne: 'cancelled' } } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]),
    Order.aggregate([
      {
        $match: {
          createdAt: { $gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) },
          status: { $ne: 'cancelled' },
        },
      },
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          revenue: { $sum: '$totalAmount' },
          orders: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]),
    Order.aggregate([
      { $match: { status: { $ne: 'cancelled' } } },
      { $group: { _id: '$restaurantId', totalRevenue: { $sum: '$totalAmount' }, orderCount: { $sum: 1 } } },
      { $sort: { totalRevenue: -1 } },
      { $limit: 5 },
      { $lookup: { from: 'restaurants', localField: '_id', foreignField: '_id', as: 'restaurant' } },
      { $unwind: '$restaurant' },
    ]),
    Restaurant.aggregate([
      { $group: { _id: '$subscriptionPlan', count: { $sum: 1 } } },
    ]),
  ]);

  const totalRevenue = monthlyRevenue[0]?.total || 0;
  const totalBookings = await Booking.countDocuments({ createdAt: { $gte: thisMonth } });

  sendSuccess(res, {
    totalRestaurants,
    activeRestaurants,
    totalOrdersToday,
    totalRevenue,
    totalBookings,
    revenueByMonth,
    topRestaurants,
    restaurantsByPlan,
  }, 'Super admin dashboard');
};

export const getRestaurantDashboard = async (req: AuthRequest, res: Response): Promise<void> => {
  const restaurantId = req.user!.restaurantId;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const [
    todayOrders,
    todayRevenue,
    monthlyOrders,
    totalCustomers,
    todayBookings,
    monthlyRevenue,
    ordersByStatus,
    revenueByDay,
    topMenuItems,
  ] = await Promise.all([
    Order.countDocuments({ restaurantId, createdAt: { $gte: today } }),
    Order.aggregate([
      { $match: { restaurantId: restaurantId as unknown as import('mongoose').Types.ObjectId, createdAt: { $gte: today }, status: { $ne: 'cancelled' } } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]),
    Order.countDocuments({ restaurantId, createdAt: { $gte: thisMonth } }),
    Customer.countDocuments({ restaurantId }),
    Booking.countDocuments({ restaurantId, bookingDate: { $gte: today } }),
    Order.aggregate([
      { $match: { restaurantId: restaurantId as unknown as import('mongoose').Types.ObjectId, createdAt: { $gte: thisMonth }, status: { $ne: 'cancelled' } } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]),
    Order.aggregate([
      { $match: { restaurantId: restaurantId as unknown as import('mongoose').Types.ObjectId } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    Order.aggregate([
      {
        $match: {
          restaurantId: restaurantId as unknown as import('mongoose').Types.ObjectId,
          createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
          status: { $ne: 'cancelled' },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$totalAmount' },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    Order.aggregate([
      { $match: { restaurantId: restaurantId as unknown as import('mongoose').Types.ObjectId } },
      { $unwind: '$items' },
      { $group: { _id: '$items.name', quantity: { $sum: '$items.quantity' }, revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } } } },
      { $sort: { quantity: -1 } },
      { $limit: 5 },
    ]),
  ]);

  sendSuccess(res, {
    todayOrders,
    todayRevenue: todayRevenue[0]?.total || 0,
    monthlyOrders,
    totalCustomers,
    todayBookings,
    monthlyRevenue: monthlyRevenue[0]?.total || 0,
    ordersByStatus,
    revenueByDay,
    topMenuItems,
  }, 'Restaurant dashboard');
};

export const getCustomers = async (req: AuthRequest, res: Response): Promise<void> => {
  const restaurantId = req.user!.role !== 'super_admin'
    ? req.user!.restaurantId
    : req.query.restaurantId;

  const customers = await Customer.find(restaurantId ? { restaurantId } : {})
    .sort({ totalSpent: -1 })
    .limit(100);
  sendSuccess(res, customers, 'Customers retrieved');
};

export const getSalesAnalytics = async (req: AuthRequest, res: Response): Promise<void> => {
  const restaurantId = req.user!.role !== 'super_admin' ? req.user!.restaurantId : req.query.restaurantId;
  const period = (req.query.period as string) || 'month';

  const daysMap: Record<string, number> = { week: 7, month: 30, year: 365 };
  const days = daysMap[period] || 30;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const matchFilter: Record<string, unknown> = { createdAt: { $gte: since }, status: { $ne: 'cancelled' } };
  if (restaurantId) matchFilter.restaurantId = restaurantId;

  const [revenueData, paymentMethods, orderStatusBreakdown] = await Promise.all([
    Order.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$totalAmount' },
          orders: { $sum: 1 },
          avgOrderValue: { $avg: '$totalAmount' },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    Order.aggregate([
      { $match: matchFilter },
      { $group: { _id: '$paymentMethod', count: { $sum: 1 }, total: { $sum: '$totalAmount' } } },
    ]),
    Order.aggregate([
      { $match: { ...(restaurantId ? { restaurantId } : {}) } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
  ]);

  sendSuccess(res, { revenueData, paymentMethods, orderStatusBreakdown }, 'Sales analytics');
};
