# 🍽️ Restaurant SaaS Platform

A full-stack, multi-tenant restaurant management SaaS with real-time features.

---

## Tech Stack

| Layer      | Technology                                              |
|------------|----------------------------------------------------------|
| Backend    | Node.js · Express · TypeScript · MongoDB · Socket.IO    |
| Frontend   | React 18 · TypeScript · TailwindCSS · React Query v5    |
| Auth       | JWT (15min access + 7d refresh) · bcryptjs              |
| Realtime   | Socket.IO (per-restaurant rooms)                        |
| State      | Zustand (auth) · TanStack Query (server state)          |

---

## Features

### Platform (Super Admin)
- Multi-restaurant management with CRUD and status control
- Platform-wide analytics with revenue charts
- Subscription plan management (Basic / Pro / Enterprise)
- All orders and bookings cross-restaurant view
- User management with role filtering

### Restaurant (Admin)
- **Orders** — create, track, and update order status in real-time
- **Bookings** — full reservation lifecycle (pending → confirmed → seated → completed)
- **Menu** — categories + items with dietary flags, availability toggles, featured items
- **Customers** — auto-built customer profiles from orders
- **Staff** — add/remove team members with role assignment
- **Reports** — revenue charts, top items, orders by status
- **Settings** — restaurant profile, opening hours, currency/timezone

### Staff
- Live dashboard with today's active orders and upcoming bookings
- Order status updates with one-tap flow
- Booking management with seat/complete/no-show actions

### POS Terminal
- Full-screen point-of-sale with category tabs and item grid
- Cart with quantity controls and order notes
- Real-time live orders panel via Socket.IO
- One-click order status updates from the POS
- Payment method selection (cash, card, UPI, online)

---

## Quick Start

### Prerequisites
- Node.js 20+
- MongoDB 7 (local or Atlas)

### 1. Clone and install

```bash
git clone <repo-url>
cd restaurant-saas

# Backend
cd backend && npm install
cp .env.example .env   # edit with your values

# Frontend
cd ../frontend && npm install
```

### 2. Seed demo data

```bash
cd /Users/vinaykhanduri/Downloads/restaurant-saas
cd backend
npm run seed
```

This creates:
| Role             | Email                        | Password     |
|------------------|------------------------------|--------------|
| Super Admin      | superadmin@platform.com      | password123  |
| Restaurant Admin | admin@grandbistro.com        | password123  |
| Staff            | staff@grandbistro.com        | password123  |

Two more restaurants also seeded: Spice Garden and Sakura Japanese Kitchen.

### 3. Run locally

```bash
# Terminal 1 — backend
cd backend && npm run dev

# Terminal 2 — frontend
cd frontend && npm run dev
```

Frontend: http://localhost:5173  
Backend API: http://localhost:5000/api

### 4. Docker Compose (all-in-one)

```bash
docker-compose up -d
```

---

## Project Structure

```
restaurant-saas/
├── backend/
│   ├── src/
│   │   ├── config/         # App config, DB connection
│   │   ├── controllers/    # Route handlers
│   │   ├── middleware/      # Auth, error handling, rate limiting
│   │   ├── models/         # Mongoose schemas
│   │   ├── routes/         # Express routers
│   │   ├── scripts/        # seed.ts
│   │   ├── socket/         # Socket.IO setup and emitters
│   │   ├── types/          # TypeScript interfaces
│   │   └── utils/          # JWT, response helpers, pagination
│   └── .env.example
│
└── frontend/
    └── src/
        ├── api/            # Axios client + service functions
        ├── components/
        │   ├── layout/     # Sidebar, TopBar
        │   ├── modals/     # CreateOrderModal
        │   └── ui/         # Button, Card, Input, Modal, etc.
        ├── context/        # Zustand auth store, Socket context
        ├── hooks/          # React Query data hooks
        ├── layouts/        # DashboardLayout
        ├── pages/
        │   ├── auth/
        │   ├── super-admin/
        │   ├── restaurant-admin/
        │   ├── staff/
        │   └── pos/        # POS terminal
        ├── routes/         # React Router with role guards
        ├── types/          # TypeScript interfaces
        └── utils/          # Formatting helpers
```

---

## API Overview

| Method | Endpoint                              | Description                  |
|--------|---------------------------------------|------------------------------|
| POST   | /api/auth/login                       | Login, returns JWT pair      |
| POST   | /api/auth/refresh                     | Refresh access token         |
| GET    | /api/restaurants                      | List restaurants (super admin)|
| POST   | /api/restaurants                      | Create restaurant            |
| GET    | /api/orders                           | List orders (filtered)       |
| POST   | /api/orders                           | Create order                 |
| PATCH  | /api/orders/:id/status                | Update order status          |
| GET    | /api/bookings                         | List bookings                |
| POST   | /api/bookings                         | Create booking               |
| GET    | /api/menu/full                        | Full menu with categories    |
| GET    | /api/analytics/super-admin/dashboard  | Platform stats               |
| GET    | /api/analytics/restaurant/:id/dashboard | Restaurant stats           |

---

## Socket.IO Events

| Event               | Direction      | Description                  |
|---------------------|----------------|------------------------------|
| `order:created`     | server → client | New order placed             |
| `order:updated`     | server → client | Order status changed         |
| `order:completed`   | server → client | Order delivered              |
| `order:cancelled`   | server → client | Order cancelled              |
| `booking:created`   | server → client | New booking created          |
| `booking:updated`   | server → client | Booking changed              |
| `booking:confirmed` | server → client | Booking confirmed            |
| `booking:cancelled` | server → client | Booking cancelled            |

Rooms: `restaurant:{restaurantId}` and `super_admin`

---

## Environment Variables

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/restaurant-saas
JWT_SECRET=your_jwt_secret_min_32_chars
JWT_REFRESH_SECRET=your_refresh_secret_min_32_chars
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

---

## How to Push Changes to GitHub

This project is hosted at: https://github.com/Vinay-code12/ganesha-backend.git

### First-Time Setup (connect local project to GitHub)

If you are setting up a fresh clone or new machine:

```bash
git remote add origin https://github.com/Vinay-code12/ganesha-backend.git
git branch -M main
git push -u origin main
```

---

### Pushing Changes (day-to-day workflow)

Every time you make changes to any file (frontend or backend), follow these steps:

#### Step 1 — Check what has changed
```bash
git status
```
This shows which files have been modified, added, or deleted.

#### Step 2 — Stage the files you want to push

To stage a **specific file**:
```bash
git add frontend/src/api/client.ts
```

To stage **all changed files** at once:
```bash
git add .
```

#### Step 3 — Commit with a message describing what you changed
```bash
git commit -m "describe what you changed here"
```

For example:
```bash
git commit -m "fix: update API base URL to DuckDNS domain"
```

#### Step 4 — Push to GitHub
```bash
git push origin main
```

---

### Common Examples

| What you changed | Command to stage |
|------------------|-----------------|
| API client URL | `git add frontend/src/api/client.ts` |
| Frontend types | `git add frontend/src/types/index.ts` |
| Backend config | `git add backend/src/config/index.ts` |
| Everything at once | `git add .` |

---

### Full Example (push a frontend change)

```bash
# 1. Check status
git status

# 2. Stage the changed file
git add frontend/src/api/client.ts

# 3. Commit
git commit -m "fix: update backend URL to production domain"

# 4. Push
git push origin main
```

> **Note:** After every `git push origin main`, AWS Amplify automatically detects the push and starts a new build. You can watch the progress in the Amplify Console.