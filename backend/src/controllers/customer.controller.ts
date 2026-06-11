import { Response } from 'express';
import { Customer, Staff } from '../models/Other';
import { User } from '../models/User';
import { sendSuccess, sendError } from '../utils/response';
import { paginate, buildPaginationMeta } from '../utils/helpers';
import { AuthRequest } from '../types';

// CUSTOMERS
export const createCustomer = async (req: AuthRequest, res: Response): Promise<void> => {
  const restaurantId = req.user!.restaurantId;
  const customer = await Customer.create({ restaurantId, ...req.body });
  sendSuccess(res, customer, 'Customer created', 201);
};

export const getCustomers = async (req: AuthRequest, res: Response): Promise<void> => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const restaurantId = req.user!.role !== 'super_admin' ? req.user!.restaurantId : req.query.restaurantId;
  const filter: Record<string, unknown> = {};
  if (restaurantId) filter.restaurantId = restaurantId;
  if (req.query.search) {
    filter['$or'] = [
      { name: { $regex: req.query.search, $options: 'i' } },
      { email: { $regex: req.query.search, $options: 'i' } },
    ];
  }

  const [customers, total] = await Promise.all([
    Customer.find(filter).sort({ totalSpent: -1 }).skip(paginate(page, limit).skip).limit(limit),
    Customer.countDocuments(filter),
  ]);
  sendSuccess(res, customers, 'Customers retrieved', 200, buildPaginationMeta(total, page, limit));
};

export const updateCustomer = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const restaurantId = req.user!.restaurantId;
  const customer = await Customer.findOneAndUpdate({ _id: id, restaurantId }, req.body, { new: true });
  if (!customer) { sendError(res, 'Customer not found', 404); return; }
  sendSuccess(res, customer, 'Customer updated');
};

// STAFF
export const addStaff = async (req: AuthRequest, res: Response): Promise<void> => {
  const restaurantId = req.user!.restaurantId!;
  const { name, email, password, phone, role: staffRole, department, salary } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) { sendError(res, 'Email already in use', 409); return; }

  const user = await User.create({ name, email, password, role: 'staff', restaurantId });
  const staff = await Staff.create({ restaurantId, userId: user._id, name, email, phone, role: staffRole, department, salary });

  sendSuccess(res, { user, staff }, 'Staff member added', 201);
};

export const getStaff = async (req: AuthRequest, res: Response): Promise<void> => {
  const restaurantId = req.user!.restaurantId;
  const staff = await Staff.find({ restaurantId })
    .populate('userId', 'name email lastLogin isActive')
    .sort({ joinDate: -1 });
  sendSuccess(res, staff, 'Staff retrieved');
};

export const updateStaff = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const restaurantId = req.user!.restaurantId;
  const staff = await Staff.findOneAndUpdate({ _id: id, restaurantId }, req.body, { new: true });
  if (!staff) { sendError(res, 'Staff not found', 404); return; }
  sendSuccess(res, staff, 'Staff updated');
};

export const removeStaff = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const restaurantId = req.user!.restaurantId;
  const staff = await Staff.findOneAndDelete({ _id: id, restaurantId });
  if (!staff) { sendError(res, 'Staff not found', 404); return; }
  // Deactivate user account
  await User.findByIdAndUpdate(staff.userId, { isActive: false });
  sendSuccess(res, null, 'Staff removed');
};

export const getUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const { role, search } = req.query;

  const filter: Record<string, unknown> = {};
  if (role) filter.role = role;
  if (search) filter['$or'] = [
    { name: { $regex: search, $options: 'i' } },
    { email: { $regex: search, $options: 'i' } },
  ];

  const [users, total] = await Promise.all([
    User.find(filter).populate('restaurantId', 'name').sort({ createdAt: -1 }).skip(paginate(page, limit).skip).limit(limit),
    User.countDocuments(filter),
  ]);
  sendSuccess(res, users, 'Users retrieved', 200, buildPaginationMeta(total, page, limit));
};
