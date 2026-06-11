import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/restaurant-saas';

// ─── Inline schemas ───────────────────────────────────────────────────────────
const userSchema = new mongoose.Schema({
  name: String, email: { type: String, unique: true }, password: String,
  role: { type: String, enum: ['super_admin', 'restaurant_admin', 'staff'] },
  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant' },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

const restaurantSchema = new mongoose.Schema({
  name: String, email: String, phone: String, address: String, cuisine: String,
  status: { type: String, default: 'active' },
  subscriptionPlan: { type: String, default: 'pro' },
  settings: {
    currency: { type: String, default: 'USD' },
    timezone: { type: String, default: 'America/New_York' },
    taxRate: { type: Number, default: 8.5 },
  },
}, { timestamps: true });

const menuCategorySchema = new mongoose.Schema({
  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant' },
  name: String, description: String, sortOrder: { type: Number, default: 0 }, isActive: { type: Boolean, default: true },
}, { timestamps: true });

const menuItemSchema = new mongoose.Schema({
  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant' },
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuCategory' },
  name: String, description: String, price: Number,
  isAvailable: { type: Boolean, default: true },
  isFeatured: { type: Boolean, default: false },
  isVegetarian: Boolean, isVegan: Boolean, isGlutenFree: Boolean,
  preparationTime: Number, calories: Number, tags: [String],
}, { timestamps: true });

const customerSchema = new mongoose.Schema({
  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant' },
  name: String, email: String, phone: String,
  totalOrders: { type: Number, default: 0 },
  totalSpent: { type: Number, default: 0 },
  lastVisit: Date, notes: String,
}, { timestamps: true });

const orderItemSchema = new mongoose.Schema({
  menuItemId: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem' },
  name: String, price: Number, quantity: Number, notes: String,
}, { _id: false });

const orderSchema = new mongoose.Schema({
  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  orderNumber: { type: String, required: true, unique: true },
  tableNumber: String,
  items: [orderItemSchema],
  subtotal: Number, tax: Number, totalAmount: Number,
  status: { type: String, enum: ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'], default: 'pending' },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'refunded', 'failed'], default: 'pending' },
  paymentMethod: String, notes: String,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  auditTrail: { type: Array, default: [] },
}, { timestamps: true });

const bookingSchema = new mongoose.Schema({
  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  bookingNumber: { type: String, required: true, unique: true },
  customerName: String, customerEmail: String, customerPhone: String,
  bookingDate: Date, timeSlot: String, guests: Number, tableNumber: String,
  status: { type: String, enum: ['pending', 'confirmed', 'cancelled', 'completed', 'no_show'], default: 'pending' },
  specialRequests: String,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  auditTrail: { type: Array, default: [] },
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
const Restaurant = mongoose.model('Restaurant', restaurantSchema);
const MenuCategory = mongoose.model('MenuCategory', menuCategorySchema);
const MenuItem = mongoose.model('MenuItem', menuItemSchema);
const Customer = mongoose.model('Customer', customerSchema);
const Order = mongoose.model('Order', orderSchema);
const Booking = mongoose.model('Booking', bookingSchema);

// ─── Static data ──────────────────────────────────────────────────────────────
const RESTAURANTS = [
  { name: 'The Grand Bistro', email: 'admin@grandbistro.com', phone: '+1-555-0101', address: '123 Main Street, New York, NY 10001', cuisine: 'Continental', subscriptionPlan: 'enterprise' },
  { name: 'Spice Garden', email: 'admin@spicegarden.com', phone: '+1-555-0202', address: '456 Oak Avenue, Chicago, IL 60601', cuisine: 'Indian', subscriptionPlan: 'professional' },
  { name: 'Sakura Japanese Kitchen', email: 'admin@sakurakitchen.com', phone: '+1-555-0303', address: '789 Elm Street, San Francisco, CA 94102', cuisine: 'Japanese', subscriptionPlan: 'starter' },
];

const MENU_DATA = [
  { category: 'Starters', items: [
    { name: 'Bruschetta al Pomodoro', description: 'Toasted bread with fresh tomatoes, basil and garlic', price: 9.99, isVegetarian: true, preparationTime: 10, calories: 220 },
    { name: 'Crispy Calamari', description: 'Lightly breaded squid rings with marinara sauce', price: 13.99, preparationTime: 12, calories: 380 },
    { name: 'Burrata & Prosciutto', description: 'Fresh burrata cheese with aged prosciutto and arugula', price: 16.99, preparationTime: 5, calories: 420 },
    { name: 'Soup of the Day', description: "Chef's seasonal selection", price: 8.99, isVegetarian: true, isGlutenFree: true, preparationTime: 5, calories: 180 },
  ]},
  { category: 'Mains', items: [
    { name: 'Grilled Salmon', description: 'Atlantic salmon with lemon butter, seasonal vegetables and roasted potatoes', price: 28.99, isGlutenFree: true, preparationTime: 20, calories: 520, isFeatured: true },
    { name: 'Ribeye Steak 12oz', description: 'Prime cut ribeye, medium-rare by default, with truffle fries', price: 42.99, isGlutenFree: true, preparationTime: 25, calories: 780, isFeatured: true },
    { name: 'Mushroom Risotto', description: 'Wild mushroom and truffle arborio rice, parmesan', price: 22.99, isVegetarian: true, isGlutenFree: true, preparationTime: 20, calories: 480 },
    { name: 'Chicken Parmesan', description: 'Breaded chicken breast, marinara, mozzarella, spaghetti', price: 24.99, preparationTime: 22, calories: 680 },
    { name: 'Eggplant Parmigiana', description: 'Layers of eggplant, tomato sauce and melted cheese', price: 19.99, isVegetarian: true, preparationTime: 18, calories: 420 },
  ]},
  { category: 'Pasta & Pizza', items: [
    { name: 'Spaghetti Carbonara', description: 'Guanciale, egg yolk, pecorino and black pepper', price: 21.99, preparationTime: 15, calories: 580 },
    { name: 'Margherita Pizza', description: 'San Marzano tomato, fior di latte, fresh basil', price: 18.99, isVegetarian: true, preparationTime: 15, calories: 510 },
    { name: 'Truffle Pizza', description: 'Truffle cream, wild mushroom, mozzarella, arugula', price: 26.99, isVegetarian: true, preparationTime: 15, calories: 550, isFeatured: true },
    { name: 'Penne Arrabiata', description: 'Spicy tomato sauce with garlic and chilli', price: 17.99, isVegetarian: true, isVegan: true, preparationTime: 12, calories: 420, tags: ['spicy'] },
  ]},
  { category: 'Desserts', items: [
    { name: 'Tiramisu', description: 'Classic Italian dessert with espresso and mascarpone', price: 9.99, isVegetarian: true, preparationTime: 5, calories: 380 },
    { name: 'Crème Brûlée', description: 'Vanilla custard with caramelised sugar crust', price: 8.99, isVegetarian: true, isGlutenFree: true, preparationTime: 5, calories: 340 },
    { name: 'Chocolate Fondant', description: 'Warm dark chocolate cake with vanilla ice cream', price: 11.99, isVegetarian: true, preparationTime: 12, calories: 520 },
  ]},
  { category: 'Drinks', items: [
    { name: 'House Wine (Glass)', description: 'Red or white, ask your server', price: 9.99, isVegetarian: true, isVegan: true, isGlutenFree: true, preparationTime: 2, calories: 125 },
    { name: 'Craft Beer', description: 'Rotating selection of local craft beers', price: 7.99, preparationTime: 2, calories: 180 },
    { name: 'Fresh Lemonade', description: 'House-squeezed with mint and soda', price: 4.99, isVegetarian: true, isVegan: true, isGlutenFree: true, preparationTime: 3, calories: 120 },
    { name: 'Espresso', description: 'Double shot of premium Italian espresso', price: 3.99, isVegetarian: true, isVegan: true, isGlutenFree: true, preparationTime: 3, calories: 5 },
  ]},
];

const CUSTOMER_NAMES = [
  ['James Wilson', 'james.wilson@email.com', '+1-555-1001'],
  ['Sarah Johnson', 'sarah.j@email.com', '+1-555-1002'],
  ['Michael Brown', 'mbrown@email.com', '+1-555-1003'],
  ['Emily Davis', 'emily.davis@email.com', '+1-555-1004'],
  ['David Martinez', 'david.m@email.com', '+1-555-1005'],
  ['Jessica Taylor', 'jess.taylor@email.com', '+1-555-1006'],
  ['Christopher Lee', 'chris.lee@email.com', '+1-555-1007'],
  ['Amanda White', 'a.white@email.com', '+1-555-1008'],
  ['Daniel Harris', 'dan.harris@email.com', '+1-555-1009'],
  ['Stephanie Clark', 's.clark@email.com', '+1-555-1010'],
  ['Ryan Thompson', 'r.thompson@email.com', '+1-555-1011'],
  ['Lauren Anderson', 'l.anderson@email.com', '+1-555-1012'],
  ['Kevin Jackson', 'k.jackson@email.com', '+1-555-1013'],
  ['Megan Robinson', 'm.robinson@email.com', '+1-555-1014'],
  ['Brandon Lewis', 'b.lewis@email.com', '+1-555-1015'],
  ['Nicole Walker', 'n.walker@email.com', '+1-555-1016'],
  ['Tyler Hall', 't.hall@email.com', '+1-555-1017'],
  ['Brittany Young', 'b.young@email.com', '+1-555-1018'],
  ['Justin Allen', 'j.allen@email.com', '+1-555-1019'],
  ['Samantha King', 'sam.king@email.com', '+1-555-1020'],
];

const TIME_SLOTS = ['12:00 PM', '12:30 PM', '1:00 PM', '1:30 PM', '2:00 PM', '6:00 PM', '6:30 PM', '7:00 PM', '7:30 PM', '8:00 PM', '8:30 PM'];
const SPECIAL_REQUESTS = ['Window seat preferred', 'Birthday celebration', 'Allergic to nuts', 'Vegetarian menu please', 'Anniversary dinner', 'High chair needed', '', '', ''];
const PAYMENT_METHODS = ['cash', 'card', 'upi', 'card', 'card'];
const TABLE_NUMBERS = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10'];

// ─── Helpers ──────────────────────────────────────────────────────────────────
let orderSeq = 1;
let bookingSeq = 1;

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function makeOrderNumber(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `ORD-${y}${m}${d}-${String(orderSeq++).padStart(5, '0')}`;
}

function makeBookingNumber(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `BKG-${y}${m}${d}-${String(bookingSeq++).padStart(4, '0')}`;
}

function pickOrderStatus(daysBack: number): { status: string; paymentStatus: string } {
  if (daysBack === 0) {
    // Today — mix of live statuses
    const s = randItem(['pending', 'confirmed', 'preparing', 'ready', 'delivered']);
    return { status: s, paymentStatus: s === 'delivered' ? 'paid' : randItem(['pending', 'paid']) };
  }
  // Past orders — mostly completed
  const r = Math.random();
  if (r < 0.82) return { status: 'delivered', paymentStatus: 'paid' };
  if (r < 0.90) return { status: 'cancelled', paymentStatus: randItem(['refunded', 'failed']) };
  return { status: 'delivered', paymentStatus: 'refunded' };
}

function pickBookingStatus(daysBack: number): string {
  if (daysBack < 0) return randItem(['pending', 'confirmed', 'confirmed']); // future
  const r = Math.random();
  if (r < 0.70) return 'completed';
  if (r < 0.83) return 'confirmed';
  if (r < 0.91) return 'cancelled';
  return 'no_show';
}

// ─── Seed ─────────────────────────────────────────────────────────────────────
async function seed() {
  console.log('🌱 Connecting to MongoDB...');
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected\n');

  await Promise.all([
    User.deleteMany({}), Restaurant.deleteMany({}),
    MenuCategory.deleteMany({}), MenuItem.deleteMany({}),
    Customer.deleteMany({}), Order.deleteMany({}), Booking.deleteMany({}),
  ]);
  console.log('🗑️  Cleared existing data\n');

  const hashedPassword = await bcrypt.hash('password123', 12);

  // Super Admin
  await User.create({ name: 'Super Admin', email: 'superadmin@platform.com', password: hashedPassword, role: 'super_admin' });
  console.log('👑 Super Admin created: superadmin@platform.com / password123\n');

  for (const restData of RESTAURANTS) {
    const restaurant = await Restaurant.create(restData);

    // Users
    await User.create({ name: `${restData.name} Admin`, email: restData.email, password: hashedPassword, role: 'restaurant_admin', restaurantId: restaurant._id });
    const staffEmail = restData.email.replace('admin@', 'staff@');
    const staff = await User.create({ name: `${restData.name} Staff`, email: staffEmail, password: hashedPassword, role: 'staff', restaurantId: restaurant._id });

    // Menu
    const allMenuItems: { name: string; price: number; _id: mongoose.Types.ObjectId }[] = [];
    for (let i = 0; i < MENU_DATA.length; i++) {
      const catData = MENU_DATA[i];
      const category = await MenuCategory.create({ restaurantId: restaurant._id, name: catData.category, sortOrder: i });
      for (const itemData of catData.items) {
        const item = await MenuItem.create({ ...itemData, restaurantId: restaurant._id, categoryId: category._id }) as any;
        allMenuItems.push({ name: item.name, price: item.price, _id: item._id });
      }
    }

    // Customers (20 per restaurant)
    const customerDocs: any[] = [];
    for (let ci = 0; ci < 20; ci++) {
      const [cname, cemail, cphone] = CUSTOMER_NAMES[ci];
      const c = await Customer.create({ restaurantId: restaurant._id, name: cname, email: cemail, phone: cphone });
      customerDocs.push(c);
    }

    // Orders — 180 spread over 12 months, plus 10 today
    const orderDaysDistribution: number[] = [];
    for (let day = 365; day >= 1; day--) {
      // ~0.5 orders per day on average → ~180 orders/year, weighted towards recent months
      const weight = day <= 30 ? 0.8 : day <= 90 ? 0.6 : 0.4;
      if (Math.random() < weight) orderDaysDistribution.push(day);
    }
    // Ensure today always has 8–12 orders
    for (let t = 0; t < randInt(8, 12); t++) orderDaysDistribution.push(0);

    let totalOrderCount = 0;
    let totalSpentByCustomer: Record<string, number> = {};
    let lastVisitByCustomer: Record<string, Date> = {};

    for (const daysBack of orderDaysDistribution) {
      const orderDate = daysAgo(daysBack);
      const { status, paymentStatus } = pickOrderStatus(daysBack);
      const customer = randItem(customerDocs);
      const numItems = randInt(1, 4);
      const pickedItems = [] as typeof allMenuItems;
      const shuffled = [...allMenuItems].sort(() => Math.random() - 0.5);
      for (let i = 0; i < numItems; i++) pickedItems.push(shuffled[i]);

      const items = pickedItems.map(mi => ({ menuItemId: mi._id, name: mi.name, price: mi.price, quantity: randInt(1, 3) }));
      const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
      const tax = parseFloat((subtotal * 0.085).toFixed(2));
      const totalAmount = parseFloat((subtotal + tax).toFixed(2));

      await Order.create({
        restaurantId: restaurant._id,
        customerId: customer._id,
        orderNumber: makeOrderNumber(orderDate),
        tableNumber: randItem(TABLE_NUMBERS),
        items,
        subtotal: parseFloat(subtotal.toFixed(2)),
        tax,
        totalAmount,
        status,
        paymentStatus,
        paymentMethod: randItem(PAYMENT_METHODS),
        createdBy: staff._id,
        createdAt: orderDate,
        updatedAt: orderDate,
      });

      totalOrderCount++;
      if (paymentStatus === 'paid') {
        totalSpentByCustomer[customer._id.toString()] = (totalSpentByCustomer[customer._id.toString()] || 0) + totalAmount;
      }
      if (!lastVisitByCustomer[customer._id.toString()] || orderDate > lastVisitByCustomer[customer._id.toString()]) {
        lastVisitByCustomer[customer._id.toString()] = orderDate;
      }
    }

    // Update customer aggregates
    for (const c of customerDocs) {
      const id = c._id.toString();
      await Customer.updateOne({ _id: c._id }, {
        totalOrders: orderDaysDistribution.filter((_, i) => i % customerDocs.length === customerDocs.indexOf(c)).length,
        totalSpent: parseFloat((totalSpentByCustomer[id] || 0).toFixed(2)),
        lastVisit: lastVisitByCustomer[id] || null,
      });
    }

    // Bookings — 60 over 6 months (past) + 15 upcoming
    const bookingDays: number[] = [];
    for (let day = 180; day >= 1; day--) {
      if (Math.random() < 0.35) bookingDays.push(day);
    }
    // Future bookings (next 14 days)
    for (let day = -14; day < 0; day++) {
      if (Math.random() < 0.5) bookingDays.push(day);
    }

    for (const daysBack of bookingDays) {
      const bookingDate = daysAgo(daysBack);
      const customer = randItem(customerDocs);
      const status = pickBookingStatus(daysBack);
      await Booking.create({
        restaurantId: restaurant._id,
        customerId: customer._id,
        bookingNumber: makeBookingNumber(bookingDate),
        customerName: customer.name,
        customerEmail: customer.email,
        customerPhone: customer.phone,
        bookingDate,
        timeSlot: randItem(TIME_SLOTS),
        guests: randInt(1, 8),
        tableNumber: randItem(TABLE_NUMBERS),
        status,
        specialRequests: randItem(SPECIAL_REQUESTS),
        createdBy: staff._id,
        createdAt: daysAgo(Math.max(daysBack + 1, 0)),
        updatedAt: bookingDate,
      });
    }

    const menuItemCount = MENU_DATA.reduce((s, c) => s + c.items.length, 0);
    console.log(`🍽️  ${restData.name} [${restData.subscriptionPlan}]`);
    console.log(`   Admin:    ${restData.email} / password123`);
    console.log(`   Staff:    ${staffEmail} / password123`);
    console.log(`   Menu:     ${menuItemCount} items | Customers: 20 | Orders: ${totalOrderCount} | Bookings: ${bookingDays.length}\n`);
  }

  // Final counts
  const [totalOrders, totalBookings, todayOrders] = await Promise.all([
    Order.countDocuments(),
    Booking.countDocuments(),
    Order.countDocuments({ createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) } }),
  ]);

  console.log('✅ Seed complete!');
  console.log('─────────────────────────────────────────────');
  console.log(`Platform totals: ${totalOrders} orders | ${totalBookings} bookings | ${todayOrders} today`);
  console.log('─────────────────────────────────────────────');
  console.log('Super Admin:        superadmin@platform.com');
  console.log('Restaurant Admin:   admin@grandbistro.com');
  console.log('Staff:              staff@grandbistro.com');
  console.log('Password (all):     password123');
  console.log('─────────────────────────────────────────────\n');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(err => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
