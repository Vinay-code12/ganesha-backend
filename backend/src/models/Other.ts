import mongoose, { Schema } from 'mongoose';
import { ICustomer, IStaff, ISalesReport, ISubscription } from '../types';

// Customer Model
const CustomerSchema = new Schema<ICustomer>(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    phone: { type: String },
    totalOrders: { type: Number, default: 0 },
    totalSpent: { type: Number, default: 0 },
    lastVisit: { type: Date },
    notes: { type: String },
  },
  { timestamps: true }
);
CustomerSchema.index({ restaurantId: 1 });
CustomerSchema.index({ restaurantId: 1, email: 1 });

// Staff Model
const StaffSchema = new Schema<IStaff>(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String },
    role: { type: String, required: true },
    department: { type: String, default: 'General' },
    salary: { type: Number },
    joinDate: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);
StaffSchema.index({ restaurantId: 1 });

// Sales Report Model
const SalesReportSchema = new Schema<ISalesReport>(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true },
    period: { type: String, enum: ['daily', 'weekly', 'monthly'], required: true },
    date: { type: Date, required: true },
    totalOrders: { type: Number, default: 0 },
    totalRevenue: { type: Number, default: 0 },
    averageOrderValue: { type: Number, default: 0 },
    topItems: [{
      itemId: { type: Schema.Types.ObjectId, ref: 'MenuItem' },
      name: String,
      quantity: Number,
      revenue: Number,
    }],
  },
  { timestamps: true }
);
SalesReportSchema.index({ restaurantId: 1, period: 1, date: -1 });

// Subscription Model
const SubscriptionSchema = new Schema<ISubscription>(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true, unique: true },
    plan: { type: String, enum: ['starter', 'professional', 'enterprise'], required: true },
    status: { type: String, enum: ['active', 'cancelled', 'expired', 'trial'], default: 'trial' },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    amount: { type: Number, required: true },
    billingCycle: { type: String, enum: ['monthly', 'yearly'], default: 'monthly' },
  },
  { timestamps: true }
);

export const Customer = mongoose.model<ICustomer>('Customer', CustomerSchema);
export const Staff = mongoose.model<IStaff>('Staff', StaffSchema);
export const SalesReport = mongoose.model<ISalesReport>('SalesReport', SalesReportSchema);
export const Subscription = mongoose.model<ISubscription>('Subscription', SubscriptionSchema);
