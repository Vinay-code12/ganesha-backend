import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { analyticsApi, restaurantApi, orderApi, bookingApi, menuApi, customerApi, staffApi } from '../api/services';
import toast from 'react-hot-toast';
import { AxiosError } from 'axios';
import { ApiResponse } from '../types';

const handleError = (err: unknown) => {
  const error = err as AxiosError<ApiResponse>;
  toast.error(error.response?.data?.message || 'Something went wrong');
};

// Analytics
export const useSuperAdminDashboard = () =>
  useQuery({ queryKey: ['super-admin-dashboard'], queryFn: () => analyticsApi.getSuperAdminDashboard().then(r => r.data.data), staleTime: 30000 });

export const useRestaurantDashboard = () =>
  useQuery({ queryKey: ['restaurant-dashboard'], queryFn: () => analyticsApi.getRestaurantDashboard().then(r => r.data.data), staleTime: 30000 });

export const useSalesAnalytics = (params?: Record<string, unknown>) =>
  useQuery({ queryKey: ['sales-analytics', params], queryFn: () => analyticsApi.getSales(params).then(r => r.data.data) });

// Restaurants
export const useRestaurants = (params?: Record<string, unknown>) =>
  useQuery({ queryKey: ['restaurants', params], queryFn: () => restaurantApi.getAll(params).then(r => r.data) });

export const useRestaurant = (id: string) =>
  useQuery({ queryKey: ['restaurant', id], queryFn: () => restaurantApi.get(id).then(r => r.data.data), enabled: !!id });

export const useMyRestaurant = () =>
  useQuery({ queryKey: ['my-restaurant'], queryFn: () => restaurantApi.getMy().then(r => r.data.data) });

export const useCreateRestaurant = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => restaurantApi.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['restaurants'] }); toast.success('Restaurant created!'); },
    onError: handleError,
  });
};

export const useUpdateRestaurant = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => restaurantApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['restaurants'] }); toast.success('Restaurant updated!'); },
    onError: handleError,
  });
};

export const useUpdateRestaurantStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => restaurantApi.updateStatus(id, status),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['restaurants'] }); toast.success('Status updated!'); },
    onError: handleError,
  });
};

// Orders
export const useOrders = (params?: Record<string, unknown>) =>
  useQuery({ queryKey: ['orders', params], queryFn: () => orderApi.getAll(params).then(r => r.data) });

export const useTodayOrders = (params?: Record<string, unknown>) =>
  useQuery({ queryKey: ['today-orders', params], queryFn: () => orderApi.getToday(params).then(r => r.data.data), refetchInterval: 30000 });

export const useCreateOrder = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => orderApi.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['orders'] }); toast.success('Order created!'); },
    onError: handleError,
  });
};

export const useUpdateOrderStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => orderApi.updateStatus(id, status),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['orders'] }); qc.invalidateQueries({ queryKey: ['today-orders'] }); },
    onError: handleError,
  });
};

// Bookings
export const useBookings = (params?: Record<string, unknown>) =>
  useQuery({ queryKey: ['bookings', params], queryFn: () => bookingApi.getAll(params).then(r => r.data) });

export const useTodayBookings = () =>
  useQuery({ queryKey: ['today-bookings'], queryFn: () => bookingApi.getToday().then(r => r.data.data), refetchInterval: 60000 });

export const useCreateBooking = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => bookingApi.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['bookings'] }); toast.success('Booking created!'); },
    onError: handleError,
  });
};

export const useUpdateBookingStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => bookingApi.updateStatus(id, status),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['bookings'] }); toast.success('Booking updated!'); },
    onError: handleError,
  });
};

// Menu
export const useFullMenu = () =>
  useQuery({ queryKey: ['full-menu'], queryFn: () => menuApi.getFullMenu().then(r => r.data.data) });

export const useMenuCategories = (params?: Record<string, unknown>) =>
  useQuery({ queryKey: ['menu-categories', params], queryFn: () => menuApi.getCategories(params).then(r => r.data.data) });

export const useMenuItems = (params?: Record<string, unknown>) =>
  useQuery({ queryKey: ['menu-items', params], queryFn: () => menuApi.getItems(params).then(r => r.data.data) });

export const useCreateMenuItem = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => menuApi.createItem(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['menu-items'] }); toast.success('Menu item added!'); },
    onError: handleError,
  });
};

export const useUpdateMenuItem = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => menuApi.updateItem(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['menu-items'] }); toast.success('Item updated!'); },
    onError: handleError,
  });
};

export const useDeleteMenuItem = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => menuApi.deleteItem(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['menu-items'] }); toast.success('Item removed!'); },
    onError: handleError,
  });
};

// Customers
export const useCustomers = (params?: Record<string, unknown>) =>
  useQuery({ queryKey: ['customers', params], queryFn: () => customerApi.getAll(params).then(r => r.data) });

// Staff
export const useStaff = () =>
  useQuery({ queryKey: ['staff'], queryFn: () => staffApi.getAll().then(r => r.data.data) });

export const useAddStaff = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => staffApi.add(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['staff'] }); toast.success('Staff added!'); },
    onError: handleError,
  });
};

// Dark mode
import { useState, useEffect } from 'react';
export const useDarkMode = () => {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved ? saved === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  return { isDark, toggle: () => setIsDark(!isDark) };
};
