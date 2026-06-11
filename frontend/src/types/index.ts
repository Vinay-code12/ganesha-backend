export type UserRole = 'super_admin' | 'restaurant_admin' | 'staff';
export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
export type PaymentStatus = 'pending' | 'paid' | 'refunded' | 'failed';
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';
export type RestaurantStatus = 'active' | 'suspended' | 'pending' | 'inactive';
export type SubscriptionPlan = 'starter' | 'professional' | 'enterprise';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  restaurantId?: string | Restaurant;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
}

export interface Restaurant {
  _id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  logo?: string;
  cuisine: string;
  subscriptionPlan: SubscriptionPlan;
  status: RestaurantStatus;
  adminId?: User;
  settings: {
    currency: string;
    timezone: string;
    taxRate: number;
    openingHours: { day: string; open: string; close: string; closed: boolean }[];
  };
  createdAt: string;
}

export interface MenuCategory {
  _id: string;
  restaurantId: string;
  name: string;
  description?: string;
  image?: string;
  sortOrder: number;
  isActive: boolean;
}

export interface MenuItem {
  _id: string;
  restaurantId: string;
  categoryId: string | MenuCategory;
  name: string;
  description?: string;
  image?: string;
  price: number;
  availability: boolean;
  isAvailable?: boolean;
  preparationTime: number;
  tags: string[];
  isVegetarian?: boolean;
  isVegan?: boolean;
  isGlutenFree?: boolean;
  isFeatured?: boolean;
  calories?: number;
}

export interface OrderItem {
  menuItemId?: string;
  name: string;
  price: number;
  quantity: number;
  notes?: string;
}

export interface Order {
  _id: string;
  restaurantId: string;
  customerId?: Customer;
  orderNumber: string;
  tableNumber?: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  totalAmount: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod?: string;
  notes?: string;
  createdBy: Partial<User>;
  auditTrail: AuditEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface Booking {
  _id: string;
  restaurantId: string;
  customerId?: Customer;
  bookingNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  guestName?: string;
  guestPhone?: string;
  bookingDate: string;
  timeSlot: string;
  guests: number;
  tableNumber?: string;
  status: BookingStatus;
  specialRequests?: string;
  notes?: string;
  createdBy: string;
  auditTrail: AuditEntry[];
  createdAt: string;
}

export interface Customer {
  _id: string;
  restaurantId: string;
  name: string;
  email: string;
  phone: string;
  totalOrders: number;
  totalSpent: number;
  lastVisit?: string;
  notes?: string;
  createdAt?: string;
}

export interface Staff {
  _id: string;
  restaurantId: string;
  userId: User;
  name: string;
  email: string;
  phone: string;
  role: string;
  department: string;
  salary?: number;
  joinDate: string;
  isActive: boolean;
}

export interface AuditEntry {
  updatedBy: string;
  role: UserRole;
  action: string;
  previousValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
  timestamp: string;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  pagination?: PaginationMeta;
  error?: string;
}

export interface DashboardStats {
  todayOrders: number;
  todayRevenue: number;
  monthlyOrders: number;
  totalCustomers: number;
  todayBookings: number;
  monthlyRevenue: number;
  ordersByStatus: { _id: string; count: number }[];
  revenueByDay: { _id: string; revenue: number; orders: number }[];
  topMenuItems: { _id: string; quantity: number; revenue: number }[];
}

export interface SuperAdminStats {
  totalRestaurants: number;
  activeRestaurants: number;
  totalOrdersToday: number;
  totalRevenue: number;
  totalBookings: number;
  revenueByMonth: { _id: { year: number; month: number }; revenue: number; orders: number }[];
  topRestaurants: { _id: string; totalRevenue: number; orderCount: number; restaurant: Restaurant }[];
  restaurantsByPlan: { _id: string; count: number }[];
}
