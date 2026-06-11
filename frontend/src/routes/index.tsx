import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../context/authStore';
import DashboardLayout from '../layouts/DashboardLayout';

// Auth
import LoginPage from '../pages/auth/LoginPage';

// Super Admin
import SuperAdminDashboard from '../pages/super-admin/DashboardPage';
import SuperAdminRestaurants from '../pages/super-admin/RestaurantsPage';
import SuperAdminOrders from '../pages/super-admin/OrdersPage';
import SuperAdminBookings from '../pages/super-admin/BookingsPage';
import SuperAdminAnalytics from '../pages/super-admin/AnalyticsPage';
import SuperAdminUsers from '../pages/super-admin/UsersPage';
import SuperAdminSettings from '../pages/super-admin/SettingsPage';

// Restaurant Admin
import RestaurantDashboard from '../pages/restaurant-admin/DashboardPage';
import RestaurantOrders from '../pages/restaurant-admin/OrdersPage';
import RestaurantBookings from '../pages/restaurant-admin/BookingsPage';
import RestaurantMenu from '../pages/restaurant-admin/MenuPage';
import RestaurantCustomers from '../pages/restaurant-admin/CustomersPage';
import RestaurantStaff from '../pages/restaurant-admin/StaffPage';
import RestaurantReports from '../pages/restaurant-admin/ReportsPage';
import RestaurantSettings from '../pages/restaurant-admin/SettingsPage';

// Staff
import StaffDashboard from '../pages/staff/DashboardPage';
import StaffOrders from '../pages/staff/OrdersPage';
import StaffBookings from '../pages/staff/BookingsPage';

// POS
import POSPage from '../pages/pos/POSPage';

// Misc
import NotFoundPage from '../pages/NotFoundPage';

function RequireAuth({ children }: { children: JSX.Element }) {
  const { user } = useAuthStore();
  const location = useLocation();
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  return children;
}

function RequireRole({ roles, children }: { roles: string[]; children: JSX.Element }) {
  const { user } = useAuthStore();
  if (!user || !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

function RootRedirect() {
  const { user } = useAuthStore();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'super_admin') return <Navigate to="/super-admin/dashboard" replace />;
  if (user.role === 'restaurant_admin') return <Navigate to="/admin/dashboard" replace />;
  return <Navigate to="/staff/dashboard" replace />;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<RootRedirect />} />

      {/* Super Admin */}
      <Route path="/super-admin" element={
        <RequireAuth><RequireRole roles={['super_admin']}><DashboardLayout /></RequireRole></RequireAuth>
      }>
        <Route path="dashboard" element={<SuperAdminDashboard />} />
        <Route path="restaurants" element={<SuperAdminRestaurants />} />
        <Route path="orders" element={<SuperAdminOrders />} />
        <Route path="bookings" element={<SuperAdminBookings />} />
        <Route path="analytics" element={<SuperAdminAnalytics />} />
        <Route path="users" element={<SuperAdminUsers />} />
        <Route path="settings" element={<SuperAdminSettings />} />
      </Route>

      {/* Restaurant Admin */}
      <Route path="/admin" element={
        <RequireAuth><RequireRole roles={['restaurant_admin']}><DashboardLayout /></RequireRole></RequireAuth>
      }>
        <Route path="dashboard" element={<RestaurantDashboard />} />
        <Route path="orders" element={<RestaurantOrders />} />
        <Route path="bookings" element={<RestaurantBookings />} />
        <Route path="menu" element={<RestaurantMenu />} />
        <Route path="customers" element={<RestaurantCustomers />} />
        <Route path="staff" element={<RestaurantStaff />} />
        <Route path="reports" element={<RestaurantReports />} />
        <Route path="settings" element={<RestaurantSettings />} />
      </Route>

      {/* Staff */}
      <Route path="/staff" element={
        <RequireAuth><RequireRole roles={['staff']}><DashboardLayout /></RequireRole></RequireAuth>
      }>
        <Route path="dashboard" element={<StaffDashboard />} />
        <Route path="orders" element={<StaffOrders />} />
        <Route path="bookings" element={<StaffBookings />} />
      </Route>

      {/* POS — accessible by admin and staff */}
      <Route path="/pos" element={
        <RequireAuth><POSPage /></RequireAuth>
      } />

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
