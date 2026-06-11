import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/restaurant-saas',
  jwtSecret: process.env.JWT_SECRET || 'super-secret-jwt-key-change-in-production',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'super-secret-refresh-key-change-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '15m',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  clientUrl: process.env.CLIENT_URL
    ? process.env.CLIENT_URL.split(',')
    : ['http://localhost:5173', 'http://localhost:5174'],
  nodeEnv: process.env.NODE_ENV || 'development',
  bcryptRounds: 12,
  rateLimit: {
    windowMs: 15 * 60 * 1000,
    max: 100,
  },
  subscriptionPlans: {
    starter: { price: 49, maxOrders: 500, maxStaff: 5 },
    professional: { price: 149, maxOrders: 5000, maxStaff: 25 },
    enterprise: { price: 499, maxOrders: -1, maxStaff: -1 },
  },
};
