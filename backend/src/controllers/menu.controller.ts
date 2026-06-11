import { Response } from 'express';
import { MenuCategory, MenuItem } from '../models/Menu';
import { sendSuccess, sendError } from '../utils/response';
import { AuthRequest } from '../types';

const getRestaurantId = (req: AuthRequest): string => {
  return req.user!.role === 'super_admin'
    ? (req.params.restaurantId || req.body.restaurantId)
    : req.user!.restaurantId!;
};

export const createCategory = async (req: AuthRequest, res: Response): Promise<void> => {
  const restaurantId = getRestaurantId(req);
  const category = await MenuCategory.create({ restaurantId, ...req.body });
  sendSuccess(res, category, 'Category created', 201);
};

export const getCategories = async (req: AuthRequest, res: Response): Promise<void> => {
  const restaurantId = getRestaurantId(req) || req.query.restaurantId;
  const filter: Record<string, unknown> = { restaurantId };
  if (req.query.active !== undefined) filter.isActive = req.query.active === 'true';
  const categories = await MenuCategory.find(filter).sort({ sortOrder: 1, name: 1 });
  sendSuccess(res, categories, 'Categories retrieved');
};

export const updateCategory = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const restaurantId = getRestaurantId(req);
  const category = await MenuCategory.findOneAndUpdate(
    { _id: id, restaurantId },
    req.body,
    { new: true, runValidators: true }
  );
  if (!category) { sendError(res, 'Category not found', 404); return; }
  sendSuccess(res, category, 'Category updated');
};

export const deleteCategory = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const restaurantId = getRestaurantId(req);
  const category = await MenuCategory.findOneAndDelete({ _id: id, restaurantId });
  if (!category) { sendError(res, 'Category not found', 404); return; }
  sendSuccess(res, null, 'Category deleted');
};

export const createMenuItem = async (req: AuthRequest, res: Response): Promise<void> => {
  const restaurantId = getRestaurantId(req);
  const item = await MenuItem.create({ restaurantId, ...req.body });
  sendSuccess(res, item, 'Menu item created', 201);
};

export const getMenuItems = async (req: AuthRequest, res: Response): Promise<void> => {
  const restaurantId = getRestaurantId(req) || req.query.restaurantId;
  const { categoryId, availability } = req.query;

  const filter: Record<string, unknown> = { restaurantId };
  if (categoryId) filter.categoryId = categoryId;
  if (availability !== undefined) filter.availability = availability === 'true';

  const items = await MenuItem.find(filter)
    .populate('categoryId', 'name')
    .sort({ name: 1 });
  sendSuccess(res, items, 'Menu items retrieved');
};

export const getMenuItem = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const item = await MenuItem.findById(id).populate('categoryId', 'name');
  if (!item) { sendError(res, 'Menu item not found', 404); return; }
  sendSuccess(res, item, 'Menu item retrieved');
};

export const updateMenuItem = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const restaurantId = getRestaurantId(req);
  const item = await MenuItem.findOneAndUpdate(
    { _id: id, restaurantId },
    req.body,
    { new: true, runValidators: true }
  );
  if (!item) { sendError(res, 'Menu item not found', 404); return; }
  sendSuccess(res, item, 'Menu item updated');
};

export const deleteMenuItem = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const restaurantId = getRestaurantId(req);
  const item = await MenuItem.findOneAndDelete({ _id: id, restaurantId });
  if (!item) { sendError(res, 'Menu item not found', 404); return; }
  sendSuccess(res, null, 'Menu item deleted');
};

export const getFullMenu = async (req: AuthRequest, res: Response): Promise<void> => {
  const restaurantId = getRestaurantId(req) || req.params.restaurantId;
  const categories = await MenuCategory.find({ restaurantId, isActive: true }).sort({ sortOrder: 1 });
  const items = await MenuItem.find({ restaurantId, availability: true });

  const menu = categories.map(cat => ({
    ...cat.toObject(),
    items: items.filter(item => item.categoryId.toString() === cat._id.toString()),
  }));

  sendSuccess(res, menu, 'Full menu retrieved');
};
