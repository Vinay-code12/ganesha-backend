# 🚀 How to Run Frontend & Backend Together

This project uses [`concurrently`](https://www.npmjs.com/package/concurrently) at the root level to start **both** the backend API and the frontend UI with a **single command**.

---

## 📁 Project Structure

```
restaurant-saas/           ← Root (run commands from here)
├── backend/               ← Express + TypeScript API (port 5001)
├── frontend/              ← React + Vite UI (port 5173)
├── package.json           ← Root scripts using concurrently
└── HOW_TO_RUN.md          ← You are here
```

---

## ✅ Prerequisites

Make sure these are installed on your machine:

| Tool       | Version   | Install |
|------------|-----------|---------|
| Node.js    | ≥ 18.x    | https://nodejs.org |
| npm        | ≥ 9.x     | Comes with Node.js |
| MongoDB    | ≥ 6.x     | https://www.mongodb.com/try/download/community |

> MongoDB must be **running locally** before you start the project.

---

## 🛠️ One-Time Setup

### 1. Install dependencies (both backend & frontend)

```bash
# From the root directory
cd /path/to/restaurant-saas

npm install                  # installs concurrently at root
npm run install:all          # installs backend + frontend dependencies
```

### 2. Configure environment variables

The backend `.env` file is already created at `backend/.env`.
Make sure it contains:

```env
PORT=5001
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/restaurant-saas
JWT_SECRET=your-super-secret-jwt-key-min-32-chars-here
JWT_REFRESH_SECRET=your-super-secret-refresh-key-min-32-chars
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
```

> ⚠️ `CLIENT_URL` **must** match the port Vite uses (default: `5173`).
> If you change this, update it in both `.env` and `frontend/src/api/client.ts`.

### 3. Seed the database with demo data

```bash
# From the root directory
npm run seed
```

This creates 3 restaurants and demo user accounts:

| Role             | Email                        | Password     |
|------------------|------------------------------|--------------|
| Super Admin      | superadmin@platform.com      | password123  |
| Restaurant Admin | admin@grandbistro.com        | password123  |
| Staff            | staff@grandbistro.com        | password123  |

---

## ▶️ Running the Project

### Start both Frontend & Backend with one command

```bash
# From the ROOT directory (not inside backend/ or frontend/)
cd /path/to/restaurant-saas

npm run dev
```

This starts:
- 🟢 **Backend** → http://localhost:5001  (color-coded cyan in terminal)
- 🟢 **Frontend** → http://localhost:5173  (color-coded magenta in terminal)

You will see output like:

```
[BACKEND] ✅ MongoDB Connected: localhost
[BACKEND] 🚀 Server running on port 5001 [development]
[BACKEND] 🌐 Client URL: http://localhost:5173

[FRONTEND]   VITE v5.4.21  ready in 117 ms
[FRONTEND]   ➜  Local:   http://localhost:5173/
[FRONTEND]   ➜  Network: http://192.168.x.x:5173/
```

Open **http://localhost:5173** in your browser and log in.

---

## 📜 Available Root Scripts

| Command              | Description                                      |
|----------------------|--------------------------------------------------|
| `npm run dev`        | Start both backend + frontend simultaneously     |
| `npm run seed`       | Seed MongoDB with demo restaurants & users       |
| `npm run install:all`| Install dependencies for backend and frontend    |

---

## ⚠️ Common Mistakes to Avoid

### ❌ DO NOT start servers separately in different terminals

Running `npm run dev` inside `backend/` AND `frontend/` separately causes port conflicts (`EADDRINUSE`).

```bash
# ❌ Wrong — causes port conflicts
cd backend && npm run dev   # terminal 1
cd frontend && npm run dev  # terminal 2
```

```bash
# ✅ Correct — run ONE command from the root
cd restaurant-saas
npm run dev
```

### ❌ DO NOT change CLIENT_URL without updating both files

If you change the frontend port, update **both**:
1. `backend/.env` → `CLIENT_URL=http://localhost:<new-port>`
2. `frontend/src/api/client.ts` → `const BASE_URL = 'http://localhost:5001/api/v1'`

---

## 🛑 Stopping the Servers

Press `Ctrl + C` in the terminal where `npm run dev` is running.
This stops both backend and frontend at once.

If a port is still occupied after stopping, run:

```bash
lsof -ti tcp:5001 | xargs kill -9   # kill backend port
lsof -ti tcp:5173 | xargs kill -9   # kill frontend port
```

---

## 🔄 How It Works Internally

The root `package.json` uses `concurrently` to run both npm scripts in parallel:

```json
"dev": "concurrently --names 'BACKEND,FRONTEND' --prefix-colors 'cyan,magenta'
        'npm run dev --prefix backend'
        'npm run dev --prefix frontend'"
```

- `--prefix backend` tells npm to run the script inside the `backend/` folder
- `--prefix frontend` does the same for `frontend/`
- `--names` and `--prefix-colors` add labels and color to the terminal output
