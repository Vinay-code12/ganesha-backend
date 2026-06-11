import apiClient from './client';
import { ApiResponse, User, Restaurant, Order, Booking, MenuItem, MenuCategory, Customer, Staff, DashboardStats, SuperAdminStats } from '../types';

// Auth
export const authApi = {
  login: (email: string, password: string) =>
    apiClient.post<ApiResponse<{ user: User; accessToken: string; refreshToken: string }>>('/auth/login', { email, password }),
  register: (data: Record<string, unknown>) =>
    apiClient.post<ApiResponse<{ user: User; accessToken: string; refreshToken: string }>>('/auth/register', data),
  getMe: () => apiClient.get<ApiResponse<User>>('/auth/me'),
  refreshToken: (refreshToken: string) =>
    apiClient.post<ApiResponse<{ accessToken: string; refreshToken: string }>>('/auth/refresh', { refreshToken }),
  updateProfile: (data: { name: string }) => apiClient.put<ApiResponse<User>>('/auth/profile', data),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    apiClient.put<ApiResponse>('/auth/change-password', data),
};

// Restaurants
export const restaurantApi = {
  getAll: (params?: Record<string, unknown>) => apiClient.get<ApiResponse<Restaurant[]>>('/restaurants', { params }),
  get: (id: string) => apiClient.get<ApiResponse<Restaurant>>(`/restaurants/${id}`),
  getMy: () => apiClient.get<ApiResponse<Restaurant>>('/restaurants/me'),
  create: (data: Record<string, unknown>) => apiClient.post<ApiResponse<Restaurant>>('/restaurants', data),
  update: (id: string, data: Record<string, unknown>) => apiClient.put<ApiResponse<Restaurant>>(`/restaurants/${id}`, data),
  updateStatus: (id: string, status: string) => apiClient.patch<ApiResponse<Restaurant>>(`/restaurants/${id}/status`, { status }),
  delete: (id: string) => apiClient.delete<ApiResponse>(`/restaurants/${id}`),
};

// Orders
export const orderApi = {
  getAll: (params?: Record<string, unknown>) => apiClient.get<ApiResponse<Order[]>>('/orders', { params }),
  get: (id: string) => apiClient.get<ApiResponse<Order>>(`/orders/${id}`),
  getToday: (params?: Record<string, unknown>) => apiClient.get<ApiResponse<{ orders: Order[]; stats: { total: number; count: number } }>>('/orders/today', { params }),
  create: (data: Record<string, unknown>) => apiClient.post<ApiResponse<Order>>('/orders', data),
  updateStatus: (id: string, status: string) => apiClient.patch<ApiResponse<Order>>(`/orders/${id}/status`, { status }),
  updatePayment: (id: string, data: { paymentStatus: string; paymentMethod?: string }) =>
    apiClient.patch<ApiResponse<Order>>(`/orders/${id}/payment`, data),
};

// Bookings
export const bookingApi = {
  getAll: (params?: Record<string, unknown>) => apiClient.get<ApiResponse<Booking[]>>('/bookings', { params }),
  get: (id: string) => apiClient.get<ApiResponse<Booking>>(`/bookings/${id}`),
  getToday: () => apiClient.get<ApiResponse<Booking[]>>('/bookings/today'),
  create: (data: Record<string, unknown>) => apiClient.post<ApiResponse<Booking>>('/bookings', data),
  update: (id: string, data: Record<string, unknown>) => apiClient.put<ApiResponse<Booking>>(`/bookings/${id}`, data),
  updateStatus: (id: string, status: string) => apiClient.patch<ApiResponse<Booking>>(`/bookings/${id}/status`, { status }),
};

// Menu
export const menuApi = {
  getFullMenu: () => apiClient.get<ApiResponse<(MenuCategory & { items: MenuItem[] })[]>>('/menu/full'),
  getCategories: (params?: Record<string, unknown>) => apiClient.get<ApiResponse<MenuCategory[]>>('/menu/categories', { params }),
  createCategory: (data: Record<string, unknown>) => apiClient.post<ApiResponse<MenuCategory>>('/menu/categories', data),
  updateCategory: (id: string, data: Record<string, unknown>) => apiClient.put<ApiResponse<MenuCategory>>(`/menu/categories/${id}`, data),
  deleteCategory: (id: string) => apiClient.delete<ApiResponse>(`/menu/categories/${id}`),
  getItems: (params?: Record<string, unknown>) => apiClient.get<ApiResponse<MenuItem[]>>('/menu/items', { params }),
  createItem: (data: Record<string, unknown>) => apiClient.post<ApiResponse<MenuItem>>('/menu/items', data),
  updateItem: (id: string, data: Record<string, unknown>) => apiClient.put<ApiResponse<MenuItem>>(`/menu/items/${id}`, data),
  deleteItem: (id: string) => apiClient.delete<ApiResponse>(`/menu/items/${id}`),
};

// Analytics
export const analyticsApi = {
  getSuperAdminDashboard: () => apiClient.get<ApiResponse<SuperAdminStats>>('/analytics/super-admin'),
  getRestaurantDashboard: () => apiClient.get<ApiResponse<DashboardStats>>('/analytics/restaurant'),
  getSales: (params?: Record<string, unknown>) => apiClient.get<ApiResponse<unknown>>('/analytics/sales', { params }),
};

// Customers
export const customerApi = {
  getAll: (params?: Record<string, unknown>) => apiClient.get<ApiResponse<Customer[]>>('/customers', { params }),
  create: (data: Record<string, unknown>) => apiClient.post<ApiResponse<Customer>>('/customers', data),
  update: (id: string, data: Record<string, unknown>) => apiClient.put<ApiResponse<Customer>>(`/customers/${id}`, data),
};

// Staff
export const staffApi = {
  getAll: () => apiClient.get<ApiResponse<Staff[]>>('/staff'),
  add: (data: Record<string, unknown>) => apiClient.post<ApiResponse<Staff>>('/staff', data),
  update: (id: string, data: Record<string, unknown>) => apiClient.put<ApiResponse<Staff>>(`/staff/${id}`, data),
  remove: (id: string) => apiClient.delete<ApiResponse>(`/staff/${id}`),
};

// Users (Super Admin)
export const userApi = {
  getAll: (params?: Record<string, unknown>) => apiClient.get<ApiResponse<User[]>>('/users', { params }),
};
