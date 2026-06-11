import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar, TopBar } from '../components/layout/Sidebar';
import { useDarkMode } from '../hooks';

const pageTitles: Record<string, string> = {
  '/super-admin/dashboard': 'Super Admin Dashboard',
  '/super-admin/restaurants': 'Restaurants',
  '/super-admin/users': 'Restaurant Admins',
  '/super-admin/orders': 'All Orders',
  '/super-admin/bookings': 'All Bookings',
  '/super-admin/analytics': 'Analytics',
  '/super-admin/settings': 'Settings',
  '/admin/dashboard': 'Restaurant Dashboard',
  '/admin/menu': 'Menu Management',
  '/admin/orders': 'Orders',
  '/admin/bookings': 'Bookings',
  '/admin/customers': 'Customers',
  '/admin/staff': 'Staff',
  '/admin/reports': 'Reports',
  '/admin/settings': 'Settings',
  '/staff/dashboard': 'Staff Dashboard',
  '/staff/orders': 'Orders',
  '/staff/bookings': 'Bookings',
};

const DashboardLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isDark, toggle } = useDarkMode();
  const location = useLocation();

  const title = pageTitles[location.pathname] || 'Dashboard';

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed(!collapsed)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar
          onMobileMenuOpen={() => setMobileOpen(true)}
          title={title}
          isDark={isDark}
          onToggleDark={toggle}
        />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
