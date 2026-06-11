import { Response } from 'express';
import { Order } from '../models/Order';
import { sendSuccess, sendError } from '../utils/response';
import { generateOrderNumber, paginate, buildPaginationMeta } from '../utils/helpers';
import { AuthRequest } from '../types';
import {
  emitOrderCreated, emitOrderUpdated,
  emitOrderCancelled, emitOrderCompleted, emitPaymentUpdated
} from '../socket';

export const createOrder = async (req: AuthRequest, res: Response): Promise<void> => {
  const restaurantId = req.user!.role === 'super_admin'
    ? req.body.restaurantId
    : req.user!.restaurantId;

  if (!restaurantId) {
    sendError(res, 'restaurantId required');
    return;
  }

  const { items, tableNumber, customerId, notes, paymentMethod } = req.body;
  
  const subtotal = items.reduce((sum: number, item: { price: number; quantity: number }) => 
    sum + (item.price * item.quantity), 0);
  const tax = subtotal * 0.085;
  const totalAmount = subtotal + tax;

  const order = await Order.create({
    restaurantId,
    customerId,
    orderNumber: generateOrderNumber(),
    tableNumber,
    items,
    subtotal,
    tax,
    totalAmount,
    notes,
    paymentMethod,
    createdBy: req.user!.userId,
    auditTrail: [{
      updatedBy: req.user!.userId,
      role: req.user!.role,
      action: 'order_created',
      newValue: { status: 'pending' },
      timestamp: new Date(),
    }],
  });

  emitOrderCreated(restaurantId, order);
  sendSuccess(res, order, 'Order created', 201);
};

export const getOrders = async (req: AuthRequest, res: Response): Promise<void> => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const { status, paymentStatus, startDate, endDate, restaurantId: queryRestaurantId } = req.query;

  const filter: Record<string, unknown> = {};

  if (req.user!.role === 'super_admin') {
    if (queryRestaurantId) filter.restaurantId = queryRestaurantId;
  } else {
    filter.restaurantId = req.user!.restaurantId;
  }

  if (status) filter.status = status;
  if (paymentStatus) filter.paymentStatus = paymentStatus;
  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) (filter.createdAt as Record<string, unknown>)['$gte'] = new Date(startDate as string);
    if (endDate) (filter.createdAt as Record<string, unknown>)['$lte'] = new Date(endDate as string);
  }

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .populate('customerId', 'name email phone')
      .populate('createdBy', 'name role')
      .sort({ createdAt: -1 })
      .skip(paginate(page, limit).skip)
      .limit(limit),
    Order.countDocuments(filter),
  ]);

  sendSuccess(res, orders, 'Orders retrieved', 200, buildPaginationMeta(total, page, limit));
};

export const getOrder = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const order = await Order.findById(id)
    .populate('customerId', 'name email phone')
    .populate('createdBy', 'name role');

  if (!order) { sendError(res, 'Order not found', 404); return; }

  if (req.user!.role !== 'super_admin' && order.restaurantId.toString() !== req.user!.restaurantId) {
    sendError(res, 'Access denied', 403);
    return;
  }

  sendSuccess(res, order, 'Order retrieved');
};

export const updateOrderStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { status } = req.body;

  const order = await Order.findById(id);
  if (!order) { sendError(res, 'Order not found', 404); return; }

  if (req.user!.role !== 'super_admin' && order.restaurantId.toString() !== req.user!.restaurantId) {
    sendError(res, 'Access denied', 403);
    return;
  }

  const previousStatus = order.status;
  order.status = status;
  order.auditTrail.push({
    updatedBy: req.user!.userId as unknown as import('mongoose').Types.ObjectId,
    role: req.user!.role,
    action: 'status_updated',
    previousValue: { status: previousStatus },
    newValue: { status },
    timestamp: new Date(),
  });

  await order.save();

  const restaurantId = order.restaurantId.toString();
  if (status === 'cancelled') emitOrderCancelled(restaurantId, order);
  else if (status === 'delivered') emitOrderCompleted(restaurantId, order);
  else emitOrderUpdated(restaurantId, order);

  sendSuccess(res, order, 'Order status updated');
};

export const updatePaymentStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { paymentStatus, paymentMethod } = req.body;

  const order = await Order.findById(id);
  if (!order) { sendError(res, 'Order not found', 404); return; }

  if (req.user!.role !== 'super_admin' && order.restaurantId.toString() !== req.user!.restaurantId) {
    sendError(res, 'Access denied', 403);
    return;
  }

  const prevPaymentStatus = order.paymentStatus;
  order.paymentStatus = paymentStatus;
  if (paymentMethod) order.paymentMethod = paymentMethod;

  order.auditTrail.push({
    updatedBy: req.user!.userId as unknown as import('mongoose').Types.ObjectId,
    role: req.user!.role,
    action: 'payment_updated',
    previousValue: { paymentStatus: prevPaymentStatus },
    newValue: { paymentStatus },
    timestamp: new Date(),
  });

  await order.save();
  emitPaymentUpdated(order.restaurantId.toString(), order);
  sendSuccess(res, order, 'Payment status updated');
};

export const getTodayOrders = async (req: AuthRequest, res: Response): Promise<void> => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const filter: Record<string, unknown> = {
    createdAt: { $gte: today },
    restaurantId: req.user!.role === 'super_admin'
      ? (req.query.restaurantId || undefined)
      : req.user!.restaurantId,
  };

  const [orders, stats] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1 }).limit(50),
    Order.aggregate([
      { $match: { ...filter, status: { $ne: 'cancelled' } } },
      { $group: { _id: null, total: { $sum: '$totalAmount' }, count: { $sum: 1 } } },
    ]),
  ]);

  sendSuccess(res, { orders, stats: stats[0] || { total: 0, count: 0 } }, 'Today orders');
};
