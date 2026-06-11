import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, UtensilsCrossed, ShoppingBag, Calendar, Users, ChefHat,
  BarChart3, Settings, LogOut, ChevronLeft, ChevronRight, Building2,
  UserCog, DollarSign, Monitor, Menu, X, Wifi, WifiOff
} from 'lucide-react';
import { useAuthStore } from '../../context/authStore';
import { useSocket } from '../../context/SocketContext';
import { cn } from '../../utils';
import { Avatar } from '../ui';
import ganeshaLogo from '../../assets/images.jpeg';

interface NavItem {
  path: string; label: string; icon: React.ReactNode; exact?: boolean;
}

const superAdminNav: NavItem[] = [
  { path: '/super-admin/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} />, exact: true },
  { path: '/super-admin/restaurants', label: 'Restaurants', icon: <Building2 size={18} /> },
  { path: '/super-admin/users', label: 'Restaurant Admins', icon: <UserCog size={18} /> },
  { path: '/super-admin/orders', label: 'All Orders', icon: <ShoppingBag size={18} /> },
  { path: '/super-admin/bookings', label: 'All Bookings', icon: <Calendar size={18} /> },
  { path: '/super-admin/analytics', label: 'Analytics', icon: <BarChart3 size={18} /> },
  { path: '/super-admin/settings', label: 'Settings', icon: <Settings size={18} /> },
];

const restaurantAdminNav: NavItem[] = [
  { path: '/admin/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} />, exact: true },
  { path: '/admin/menu', label: 'Menu Management', icon: <UtensilsCrossed size={18} /> },
  { path: '/admin/orders', label: 'Orders', icon: <ShoppingBag size={18} /> },
  { path: '/admin/bookings', label: 'Bookings', icon: <Calendar size={18} /> },
  { path: '/admin/customers', label: 'Customers', icon: <Users size={18} /> },
  { path: '/admin/staff', label: 'Staff', icon: <ChefHat size={18} /> },
  { path: '/admin/reports', label: 'Reports', icon: <BarChart3 size={18} /> },
  { path: '/admin/settings', label: 'Settings', icon: <Settings size={18} /> },
];

const staffNav: NavItem[] = [
  { path: '/staff/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} />, exact: true },
  { path: '/staff/orders', label: 'Orders', icon: <ShoppingBag size={18} /> },
  { path: '/staff/bookings', label: 'Bookings', icon: <Calendar size={18} /> },
];

export const Sidebar: React.FC<{ collapsed: boolean; onToggle: () => void; mobileOpen: boolean; onMobileClose: () => void }> = ({
  collapsed, onToggle, mobileOpen, onMobileClose
}) => {
  const { user, clearAuth } = useAuthStore();
  const { isConnected } = useSocket();
  const navigate = useNavigate();

  const navItems = user?.role === 'super_admin' ? superAdminNav
    : user?.role === 'restaurant_admin' ? restaurantAdminNav
    : staffNav;

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };

  const SidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={cn('flex flex-col border-b border-gray-800 flex-shrink-0 px-4 pt-4 pb-3', collapsed ? 'items-center' : 'items-start')}>
        <div className={cn('flex w-full', collapsed ? 'justify-center' : 'justify-between items-start')}>
          <div className={cn('flex flex-col', collapsed ? 'items-center' : 'items-start')}>
            <img
              src={ganeshaLogo}
              alt="Ganesha Ek Sanskriti"
              className={cn('object-contain rounded-lg', collapsed ? 'w-10 h-8' : 'w-40 h-12')}
            />
            {!collapsed && (
              <span className="font-display font-bold text-white text-xs mt-1.5 leading-tight w-40 text-center">
                Ganesha Ek Sanskriti
              </span>
            )}
          </div>
          <button onClick={onToggle} className="hidden lg:flex p-1 hover:bg-gray-700 rounded text-gray-400 mt-1">
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
          <button onClick={onMobileClose} className="lg:hidden p-1 hover:bg-gray-700 rounded text-gray-400 mt-1">
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Connection Status */}
      {!collapsed && (
        <div className={cn('mx-3 mt-3 px-3 py-2 rounded-lg flex items-center gap-2 text-xs', isConnected ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400')}>
          {isConnected ? <Wifi size={12} /> : <WifiOff size={12} />}
          {isConnected ? 'Live — Connected' : 'Disconnected'}
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 overflow-y-auto space-y-0.5">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.exact}
            onClick={onMobileClose}
            className={({ isActive }) => cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 group',
              isActive
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-gray-400 hover:bg-gray-700/50 hover:text-gray-100',
              collapsed && 'justify-center px-2'
            )}
          >
            <span className="flex-shrink-0">{item.icon}</span>
            {!collapsed && <span className="truncate">{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div className={cn('border-t border-gray-800 p-3', collapsed ? 'flex justify-center' : '')}>
        {!collapsed ? (
          <div className="flex items-center gap-3">
            <Avatar name={user?.name || 'U'} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.name}</p>
              <p className="text-xs text-gray-400 capitalize truncate">{user?.role?.replace('_', ' ')}</p>
            </div>
            <button onClick={handleLogout} className="p-1.5 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-red-400 transition-colors">
              <LogOut size={16} />
            </button>
          </div>
        ) : (
          <button onClick={handleLogout} className="p-2 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-red-400">
            <LogOut size={16} />
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <aside className={cn(
        'hidden lg:flex flex-col bg-gray-900 transition-all duration-300 flex-shrink-0 h-screen sticky top-0',
        collapsed ? 'w-16' : 'w-60'
      )}>
        {SidebarContent}
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/60" onClick={onMobileClose} />
          <aside className="relative w-64 bg-gray-900 flex flex-col h-full animate-fade-in">
            {SidebarContent}
          </aside>
        </div>
      )}
    </>
  );
};

export const TopBar: React.FC<{ onMobileMenuOpen: () => void; title?: string; isDark: boolean; onToggleDark: () => void }> = ({
  onMobileMenuOpen, title, isDark, onToggleDark
}) => {
  const { user } = useAuthStore();
  return (
    <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-40">
      <div className="flex items-center gap-3">
        <button onClick={onMobileMenuOpen} className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
          <Menu size={20} className="text-gray-600 dark:text-gray-300" />
        </button>
        {title && <h1 className="text-lg font-semibold text-gray-900 dark:text-white hidden sm:block">{title}</h1>}
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onToggleDark}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-300 transition-colors"
        >
          {isDark ? '☀️' : '🌙'}
        </button>
        <div className="flex items-center gap-2 pl-2">
          <Avatar name={user?.name || 'U'} size="sm" />
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-gray-900 dark:text-white leading-none">{user?.name}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{user?.role?.replace('_', ' ')}</p>
          </div>
        </div>
      </div>
    </header>
  );
};
