import mongoose, { Schema } from 'mongoose';
import { IBooking } from '../types';

const AuditEntrySchema = new Schema({
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  role: { type: String, required: true },
  action: { type: String, required: true },
  previousValue: { type: Schema.Types.Mixed },
  newValue: { type: Schema.Types.Mixed },
  timestamp: { type: Date, default: Date.now },
}, { _id: false });

const BookingSchema = new Schema<IBooking>(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer' },
    bookingNumber: { type: String, required: true, unique: true },
    customerName: { type: String, required: true },
    customerEmail: { type: String, required: true },
    customerPhone: { type: String, required: true },
    bookingDate: { type: Date, required: true },
    timeSlot: { type: String, required: true },
    guests: { type: Number, required: true, min: 1, max: 50 },
    tableNumber: { type: String },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled', 'completed', 'no_show'],
      default: 'pending',
    },
    specialRequests: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    auditTrail: { type: [AuditEntrySchema], default: [] },
  },
  { timestamps: true }
);

BookingSchema.index({ restaurantId: 1, bookingDate: -1 });
BookingSchema.index({ restaurantId: 1, status: 1 });
BookingSchema.index({ bookingNumber: 1 });

export const Booking = mongoose.model<IBooking>('Booking', BookingSchema);
