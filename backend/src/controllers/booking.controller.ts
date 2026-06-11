import { Response } from 'express';
import { Booking } from '../models/Booking';
import { sendSuccess, sendError } from '../utils/response';
import { generateBookingNumber, paginate, buildPaginationMeta } from '../utils/helpers';
import { AuthRequest } from '../types';
import {
  emitBookingCreated, emitBookingUpdated,
  emitBookingConfirmed, emitBookingCancelled
} from '../socket';

export const createBooking = async (req: AuthRequest, res: Response): Promise<void> => {
  const restaurantId = req.user!.role === 'super_admin'
    ? req.body.restaurantId
    : req.user!.restaurantId;

  if (!restaurantId) { sendError(res, 'restaurantId required'); return; }

  const booking = await Booking.create({
    restaurantId,
    ...req.body,
    bookingNumber: generateBookingNumber(),
    createdBy: req.user!.userId,
    auditTrail: [{
      updatedBy: req.user!.userId,
      role: req.user!.role,
      action: 'booking_created',
      newValue: { status: 'pending' },
      timestamp: new Date(),
    }],
  });

  emitBookingCreated(restaurantId, booking);
  sendSuccess(res, booking, 'Booking created', 201);
};

export const getBookings = async (req: AuthRequest, res: Response): Promise<void> => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const { status, startDate, endDate, restaurantId: queryRestaurantId } = req.query;

  const filter: Record<string, unknown> = {};

  if (req.user!.role === 'super_admin') {
    if (queryRestaurantId) filter.restaurantId = queryRestaurantId;
  } else {
    filter.restaurantId = req.user!.restaurantId;
  }

  if (status) filter.status = status;
  if (startDate || endDate) {
    filter.bookingDate = {};
    if (startDate) (filter.bookingDate as Record<string, unknown>)['$gte'] = new Date(startDate as string);
    if (endDate) (filter.bookingDate as Record<string, unknown>)['$lte'] = new Date(endDate as string);
  }

  const [bookings, total] = await Promise.all([
    Booking.find(filter)
      .populate('customerId', 'name email phone')
      .sort({ bookingDate: -1 })
      .skip(paginate(page, limit).skip)
      .limit(limit),
    Booking.countDocuments(filter),
  ]);

  sendSuccess(res, bookings, 'Bookings retrieved', 200, buildPaginationMeta(total, page, limit));
};

export const getBooking = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const booking = await Booking.findById(id).populate('customerId');
  if (!booking) { sendError(res, 'Booking not found', 404); return; }

  if (req.user!.role !== 'super_admin' && booking.restaurantId.toString() !== req.user!.restaurantId) {
    sendError(res, 'Access denied', 403);
    return;
  }
  sendSuccess(res, booking, 'Booking retrieved');
};

export const updateBooking = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const booking = await Booking.findById(id);
  if (!booking) { sendError(res, 'Booking not found', 404); return; }

  if (req.user!.role !== 'super_admin' && booking.restaurantId.toString() !== req.user!.restaurantId) {
    sendError(res, 'Access denied', 403);
    return;
  }

  const previous = { ...booking.toObject() };
  Object.assign(booking, req.body);
  booking.auditTrail.push({
    updatedBy: req.user!.userId as unknown as import('mongoose').Types.ObjectId,
    role: req.user!.role,
    action: 'booking_updated',
    previousValue: previous,
    newValue: req.body,
    timestamp: new Date(),
  });

  await booking.save();
  emitBookingUpdated(booking.restaurantId.toString(), booking);
  sendSuccess(res, booking, 'Booking updated');
};

export const updateBookingStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { status } = req.body;

  const booking = await Booking.findById(id);
  if (!booking) { sendError(res, 'Booking not found', 404); return; }

  if (req.user!.role !== 'super_admin' && booking.restaurantId.toString() !== req.user!.restaurantId) {
    sendError(res, 'Access denied', 403);
    return;
  }

  const previousStatus = booking.status;
  booking.status = status;
  booking.auditTrail.push({
    updatedBy: req.user!.userId as unknown as import('mongoose').Types.ObjectId,
    role: req.user!.role,
    action: 'status_updated',
    previousValue: { status: previousStatus },
    newValue: { status },
    timestamp: new Date(),
  });

  await booking.save();

  const restaurantId = booking.restaurantId.toString();
  if (status === 'confirmed') emitBookingConfirmed(restaurantId, booking);
  else if (status === 'cancelled') emitBookingCancelled(restaurantId, booking);
  else emitBookingUpdated(restaurantId, booking);

  sendSuccess(res, booking, 'Booking status updated');
};

export const getTodayBookings = async (req: AuthRequest, res: Response): Promise<void> => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const filter: Record<string, unknown> = {
    bookingDate: { $gte: today, $lt: tomorrow },
    restaurantId: req.user!.role !== 'super_admin' ? req.user!.restaurantId : undefined,
  };
  if (!filter.restaurantId) delete filter.restaurantId;

  const bookings = await Booking.find(filter).sort({ timeSlot: 1 });
  sendSuccess(res, bookings, 'Today bookings');
};
