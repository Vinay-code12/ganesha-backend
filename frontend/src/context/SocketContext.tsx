import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from './authStore';
import { Order, Booking } from '../types';
import toast from 'react-hot-toast';

interface SocketContextValue {
  socket: Socket | null;
  isConnected: boolean;
  joinRestaurantRoom: (restaurantId: string) => void;
}

const SocketContext = createContext<SocketContextValue>({
  socket: null,
  isConnected: false,
  joinRestaurantRoom: () => {},
});

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { accessToken, user } = useAuthStore();
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!accessToken || !user) return;

    const socket = io('/', {
      auth: { token: accessToken },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      console.log('[Socket] Connected:', socket.id);

      // Auto-join restaurant room
      const restaurantId = typeof user.restaurantId === 'string'
        ? user.restaurantId
        : (user.restaurantId as { _id: string })?._id;

      if (restaurantId) {
        socket.emit('join:restaurant', restaurantId);
      }
    });

    socket.on('disconnect', (reason) => {
      setIsConnected(false);
      console.log('[Socket] Disconnected:', reason);
    });

    socket.on('connect_error', (err) => {
      console.error('[Socket] Error:', err.message);
    });

    // Order events
    socket.on('order.created', (order: Order) => {
      toast.success(`New order #${order.orderNumber} received!`, { icon: '🍽️' });
    });

    socket.on('order.updated', (order: Order) => {
      console.log('[Socket] Order updated:', order.orderNumber);
    });

    socket.on('order.cancelled', (order: Order) => {
      toast.error(`Order #${order.orderNumber} cancelled`, { icon: '❌' });
    });

    socket.on('order.completed', (order: Order) => {
      toast.success(`Order #${order.orderNumber} completed!`, { icon: '✅' });
    });

    socket.on('order.payment.updated', (order: Order) => {
      toast(`Payment updated for #${order.orderNumber}`, { icon: '💳' });
    });

    // Booking events
    socket.on('booking.created', (booking: Booking) => {
      toast.success(`New booking from ${booking.customerName}!`, { icon: '📅' });
    });

    socket.on('booking.confirmed', (booking: Booking) => {
      toast.success(`Booking #${booking.bookingNumber} confirmed`, { icon: '✅' });
    });

    socket.on('booking.cancelled', (booking: Booking) => {
      toast.error(`Booking #${booking.bookingNumber} cancelled`, { icon: '❌' });
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [accessToken, user]);

  const joinRestaurantRoom = (restaurantId: string) => {
    socketRef.current?.emit('join:restaurant', restaurantId);
  };

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, isConnected, joinRestaurantRoom }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
