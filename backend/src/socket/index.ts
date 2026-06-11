import { Server as HTTPServer } from 'http';
import { Server, Socket } from 'socket.io';
import { config } from '../config';
import { verifyAccessToken } from '../utils/jwt';

export let io: Server;

export const initializeSocket = (server: HTTPServer): Server => {
  io = new Server(server, {
    cors: {
      origin: config.clientUrl,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
    transports: ['websocket', 'polling'],
  });

  // Auth middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication required'));
    }
    try {
      const payload = verifyAccessToken(token);
      socket.data.user = payload;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const user = socket.data.user;
    console.log(`[Socket] Connected: ${user.userId} (${user.role})`);

    // Super admin joins the global admin room + all updates
    if (user.role === 'super_admin') {
      socket.join('super_admin');
    }

    // Restaurant-specific room joining
    socket.on('join:restaurant', (restaurantId: string) => {
      // Validate user has access to this restaurant
      if (user.role === 'super_admin' || user.restaurantId === restaurantId) {
        const room = `restaurant:${restaurantId}`;
        socket.join(room);
        console.log(`[Socket] ${user.userId} joined room: ${room}`);
        socket.emit('room:joined', { room, restaurantId });
      } else {
        socket.emit('error', { message: 'Unauthorized to join this room' });
      }
    });

    socket.on('leave:restaurant', (restaurantId: string) => {
      const room = `restaurant:${restaurantId}`;
      socket.leave(room);
    });

    // POS reconnection - request missed updates
    socket.on('pos:sync', async (data: { restaurantId: string; lastSyncedAt: string }) => {
      socket.emit('pos:sync:ack', { 
        message: 'Sync initiated', 
        restaurantId: data.restaurantId,
        timestamp: new Date().toISOString() 
      });
    });

    socket.on('disconnect', (reason) => {
      console.log(`[Socket] Disconnected: ${user.userId} (${reason})`);
    });
  });

  return io;
};

// Emit to a specific restaurant room
export const emitToRestaurant = (restaurantId: string, event: string, data: unknown): void => {
  if (io) {
    io.to(`restaurant:${restaurantId}`).emit(event, data);
    // Also emit to super admin room
    io.to('super_admin').emit(event, { ...data as object, restaurantId });
  }
};

// Order events
export const emitOrderCreated = (restaurantId: string, order: unknown): void => {
  emitToRestaurant(restaurantId, 'order.created', order);
};

export const emitOrderUpdated = (restaurantId: string, order: unknown): void => {
  emitToRestaurant(restaurantId, 'order.updated', order);
};

export const emitOrderCancelled = (restaurantId: string, order: unknown): void => {
  emitToRestaurant(restaurantId, 'order.cancelled', order);
};

export const emitOrderCompleted = (restaurantId: string, order: unknown): void => {
  emitToRestaurant(restaurantId, 'order.completed', order);
};

export const emitPaymentUpdated = (restaurantId: string, order: unknown): void => {
  emitToRestaurant(restaurantId, 'order.payment.updated', order);
};

// Booking events
export const emitBookingCreated = (restaurantId: string, booking: unknown): void => {
  emitToRestaurant(restaurantId, 'booking.created', booking);
};

export const emitBookingUpdated = (restaurantId: string, booking: unknown): void => {
  emitToRestaurant(restaurantId, 'booking.updated', booking);
};

export const emitBookingConfirmed = (restaurantId: string, booking: unknown): void => {
  emitToRestaurant(restaurantId, 'booking.confirmed', booking);
};

export const emitBookingCancelled = (restaurantId: string, booking: unknown): void => {
  emitToRestaurant(restaurantId, 'booking.cancelled', booking);
};
