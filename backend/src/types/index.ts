import { Request } from 'express';
import { Document, Types } from 'mongoose';

export type UserRole = 'super_admin' | 'restaurant_admin' | 'staff';
export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
export type PaymentStatus = 'pending' | 'paid' | 'refunded' | 'failed';
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';
export type RestaurantStatus = 'active' | 'suspended' | 'pending' | 'inactive';
export type SubscriptionPlan = 'starter' | 'professional' | 'enterprise';

export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  restaurantId?: Types.ObjectId;
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidate: string): Promise<boolean>;
}

export interface IRestaurant extends Document {
  _id: Types.ObjectId;
  name: string;
  address: string;
  phone: string;
  email: string;
  logo?: string;
  cuisine: string;
  subscriptionPlan: SubscriptionPlan;
  status: RestaurantStatus;
  adminId?: Types.ObjectId;
  settings: {
    currency: string;
    timezone: string;
    taxRate: number;
    openingHours: { day: string; open: string; close: string; closed: boolean }[];
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface IMenuCategory extends Document {
  _id: Types.ObjectId;
  restaurantId: Types.ObjectId;
  name: string;
  description?: string;
  image?: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
}

export interface IMenuItem extends Document {
  _id: Types.ObjectId;
  restaurantId: Types.ObjectId;
  categoryId: Types.ObjectId;
  name: string;
  description?: string;
  image?: string;
  price: number;
  availability: boolean;
  preparationTime: number;
  tags: string[];
  nutritionInfo?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface IOrderItem {
  menuItemId: Types.ObjectId;
  name: string;
  price: number;
  quantity: number;
  notes?: string;
}

export interface IOrder extends Document {
  _id: Types.ObjectId;
  restaurantId: Types.ObjectId;
  customerId?: Types.ObjectId;
  orderNumber: string;
  tableNumber?: string;
  items: IOrderItem[];
  subtotal: number;
  tax: number;
  totalAmount: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod?: string;
  notes?: string;
  createdBy: Types.ObjectId;
  auditTrail: IAuditEntry[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IBooking extends Document {
  _id: Types.ObjectId;
  restaurantId: Types.ObjectId;
  customerId?: Types.ObjectId;
  bookingNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  bookingDate: Date;
  timeSlot: string;
  guests: number;
  tableNumber?: string;
  status: BookingStatus;
  specialRequests?: string;
  createdBy: Types.ObjectId;
  auditTrail: IAuditEntry[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ICustomer extends Document {
  _id: Types.ObjectId;
  restaurantId: Types.ObjectId;
  name: string;
  email: string;
  phone: string;
  totalOrders: number;
  totalSpent: number;
  lastVisit?: Date;
  notes?: string;
  createdAt: Date;
}

export interface IStaff extends Document {
  _id: Types.ObjectId;
  restaurantId: Types.ObjectId;
  userId: Types.ObjectId;
  name: string;
  email: string;
  phone: string;
  role: string;
  department: string;
  salary?: number;
  joinDate: Date;
  isActive: boolean;
  createdAt: Date;
}

export interface IAuditEntry {
  updatedBy: Types.ObjectId;
  role: UserRole;
  action: string;
  previousValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
  timestamp: Date;
}

export interface ISalesReport extends Document {
  _id: Types.ObjectId;
  restaurantId: Types.ObjectId;
  period: 'daily' | 'weekly' | 'monthly';
  date: Date;
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  topItems: { itemId: Types.ObjectId; name: string; quantity: number; revenue: number }[];
  createdAt: Date;
}

export interface ISubscription extends Document {
  _id: Types.ObjectId;
  restaurantId: Types.ObjectId;
  plan: SubscriptionPlan;
  status: 'active' | 'cancelled' | 'expired' | 'trial';
  startDate: Date;
  endDate: Date;
  amount: number;
  billingCycle: 'monthly' | 'yearly';
  createdAt: Date;
}

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    role: UserRole;
    restaurantId?: string;
  };
}

export interface JwtPayload {
  userId: string;
  role: UserRole;
  restaurantId?: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  error?: string;
}
