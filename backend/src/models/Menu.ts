import mongoose, { Schema } from 'mongoose';
import { IMenuCategory, IMenuItem } from '../types';

const MenuCategorySchema = new Schema<IMenuCategory>(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true },
    name: { type: String, required: true, trim: true },
    description: { type: String },
    image: { type: String },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

MenuCategorySchema.index({ restaurantId: 1, isActive: 1 });

const MenuItemSchema = new Schema<IMenuItem>(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true },
    categoryId: { type: Schema.Types.ObjectId, ref: 'MenuCategory', required: true },
    name: { type: String, required: true, trim: true },
    description: { type: String },
    image: { type: String },
    price: { type: Number, required: true, min: 0 },
    availability: { type: Boolean, default: true },
    preparationTime: { type: Number, default: 15 },
    tags: [{ type: String }],
    nutritionInfo: {
      calories: { type: Number },
      protein: { type: Number },
      carbs: { type: Number },
      fat: { type: Number },
    },
  },
  { timestamps: true }
);

MenuItemSchema.index({ restaurantId: 1, categoryId: 1 });
MenuItemSchema.index({ restaurantId: 1, availability: 1 });

export const MenuCategory = mongoose.model<IMenuCategory>('MenuCategory', MenuCategorySchema);
export const MenuItem = mongoose.model<IMenuItem>('MenuItem', MenuItemSchema);
