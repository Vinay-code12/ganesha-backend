import { Router } from 'express';
import { body } from 'express-validator';
import { authenticate, isSuperAdmin, isAdminOrAbove, isStaffOrAbove } from '../middleware/auth';
import * as authCtrl from '../controllers/auth.controller';
import * as restaurantCtrl from '../controllers/restaurant.controller';
import * as orderCtrl from '../controllers/order.controller';
import * as bookingCtrl from '../controllers/booking.controller';
import * as menuCtrl from '../controllers/menu.controller';
import * as analyticsCtrl from '../controllers/analytics.controller';
import * as customerCtrl from '../controllers/customer.controller';
import { authLimiter } from '../middleware/error';

const router = Router();

// ─── AUTH ───────────────────────────────────────────────────────────────────
const auth = Router();
auth.post('/register', authLimiter, authCtrl.register);
auth.post('/login', authLimiter, authCtrl.login);
auth.post('/refresh', authCtrl.refreshToken);
auth.get('/me', authenticate, authCtrl.getMe);
auth.put('/profile', authenticate, authCtrl.updateProfile);
auth.put('/change-password', authenticate, authCtrl.changePassword);
router.use('/auth', auth);

// ─── RESTAURANTS ─────────────────────────────────────────────────────────────
const restaurants = Router();
restaurants.post('/', authenticate, isSuperAdmin, restaurantCtrl.createRestaurant);
restaurants.get('/', authenticate, isSuperAdmin, restaurantCtrl.getAllRestaurants);
restaurants.get('/me', authenticate, isAdminOrAbove, restaurantCtrl.getMyRestaurant);
restaurants.get('/:id', authenticate, restaurantCtrl.getRestaurant);
restaurants.put('/:id', authenticate, isAdminOrAbove, restaurantCtrl.updateRestaurant);
restaurants.patch('/:id/status', authenticate, isSuperAdmin, restaurantCtrl.updateRestaurantStatus);
restaurants.delete('/:id', authenticate, isSuperAdmin, restaurantCtrl.deleteRestaurant);
router.use('/restaurants', restaurants);

// ─── ORDERS ──────────────────────────────────────────────────────────────────
const orders = Router();
orders.post('/', authenticate, isAdminOrAbove, orderCtrl.createOrder);
orders.get('/', authenticate, isStaffOrAbove, orderCtrl.getOrders);
orders.get('/today', authenticate, isStaffOrAbove, orderCtrl.getTodayOrders);
orders.get('/:id', authenticate, isStaffOrAbove, orderCtrl.getOrder);
orders.patch('/:id/status', authenticate, isStaffOrAbove, orderCtrl.updateOrderStatus);
orders.patch('/:id/payment', authenticate, isAdminOrAbove, orderCtrl.updatePaymentStatus);
router.use('/orders', orders);

// ─── BOOKINGS ────────────────────────────────────────────────────────────────
const bookings = Router();
bookings.post('/', authenticate, isStaffOrAbove, bookingCtrl.createBooking);
bookings.get('/', authenticate, isStaffOrAbove, bookingCtrl.getBookings);
bookings.get('/today', authenticate, isStaffOrAbove, bookingCtrl.getTodayBookings);
bookings.get('/:id', authenticate, isStaffOrAbove, bookingCtrl.getBooking);
bookings.put('/:id', authenticate, isAdminOrAbove, bookingCtrl.updateBooking);
bookings.patch('/:id/status', authenticate, isStaffOrAbove, bookingCtrl.updateBookingStatus);
router.use('/bookings', bookings);

// ─── MENU ─────────────────────────────────────────────────────────────────────
const menu = Router();
menu.get('/full', authenticate, menuCtrl.getFullMenu);
menu.post('/categories', authenticate, isAdminOrAbove, menuCtrl.createCategory);
menu.get('/categories', authenticate, menuCtrl.getCategories);
menu.put('/categories/:id', authenticate, isAdminOrAbove, menuCtrl.updateCategory);
menu.delete('/categories/:id', authenticate, isAdminOrAbove, menuCtrl.deleteCategory);
menu.post('/items', authenticate, isAdminOrAbove, menuCtrl.createMenuItem);
menu.get('/items', authenticate, menuCtrl.getMenuItems);
menu.get('/items/:id', authenticate, menuCtrl.getMenuItem);
menu.put('/items/:id', authenticate, isAdminOrAbove, menuCtrl.updateMenuItem);
menu.delete('/items/:id', authenticate, isAdminOrAbove, menuCtrl.deleteMenuItem);
router.use('/menu', menu);

// ─── ANALYTICS ───────────────────────────────────────────────────────────────
const analytics = Router();
analytics.get('/super-admin', authenticate, isSuperAdmin, analyticsCtrl.getSuperAdminDashboard);
analytics.get('/restaurant', authenticate, isAdminOrAbove, analyticsCtrl.getRestaurantDashboard);
analytics.get('/sales', authenticate, isAdminOrAbove, analyticsCtrl.getSalesAnalytics);
router.use('/analytics', analytics);

// ─── CUSTOMERS ───────────────────────────────────────────────────────────────
const customers = Router();
customers.post('/', authenticate, isAdminOrAbove, customerCtrl.createCustomer);
customers.get('/', authenticate, isAdminOrAbove, customerCtrl.getCustomers);
customers.put('/:id', authenticate, isAdminOrAbove, customerCtrl.updateCustomer);
router.use('/customers', customers);

// ─── STAFF ───────────────────────────────────────────────────────────────────
const staff = Router();
staff.post('/', authenticate, isAdminOrAbove, customerCtrl.addStaff);
staff.get('/', authenticate, isAdminOrAbove, customerCtrl.getStaff);
staff.put('/:id', authenticate, isAdminOrAbove, customerCtrl.updateStaff);
staff.delete('/:id', authenticate, isAdminOrAbove, customerCtrl.removeStaff);
router.use('/staff', staff);

// ─── USERS (Super Admin) ──────────────────────────────────────────────────────
const users = Router();
users.get('/', authenticate, isSuperAdmin, customerCtrl.getUsers);
router.use('/users', users);

export default router;
