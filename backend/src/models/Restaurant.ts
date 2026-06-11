import mongoose, { Schema } from 'mongoose';
import { IRestaurant } from '../types';

const DayScheduleSchema = new Schema({
  day: { type: String, required: true },
  open: { type: String, default: '09:00' },
  close: { type: String, default: '22:00' },
  closed: { type: Boolean, default: false },
}, { _id: false });

const RestaurantSchema = new Schema<IRestaurant>(
  {
    name: { type: String, required: true, trim: true, maxlength: 200 },
    address: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    logo: { type: String },
    cuisine: { type: String, default: 'Multi-cuisine' },
    subscriptionPlan: {
      type: String,
      enum: ['starter', 'professional', 'enterprise'],
      default: 'starter',
    },
    status: {
      type: String,
      enum: ['active', 'suspended', 'pending', 'inactive'],
      default: 'pending',
    },
    adminId: { type: Schema.Types.ObjectId, ref: 'User' },
    settings: {
      currency: { type: String, default: 'USD' },
      timezone: { type: String, default: 'America/New_York' },
      taxRate: { type: Number, default: 8.5, min: 0, max: 100 },
      openingHours: { type: [DayScheduleSchema], default: () => [
        { day: 'Monday', open: '09:00', close: '22:00', closed: false },
        { day: 'Tuesday', open: '09:00', close: '22:00', closed: false },
        { day: 'Wednesday', open: '09:00', close: '22:00', closed: false },
        { day: 'Thursday', open: '09:00', close: '22:00', closed: false },
        { day: 'Friday', open: '09:00', close: '23:00', closed: false },
        { day: 'Saturday', open: '10:00', close: '23:00', closed: false },
        { day: 'Sunday', open: '10:00', close: '21:00', closed: false },
      ]},
    },
  },
  { timestamps: true }
);

RestaurantSchema.index({ status: 1 });
RestaurantSchema.index({ subscriptionPlan: 1 });

export const Restaurant = mongoose.model<IRestaurant>('Restaurant', RestaurantSchema);
