# IMS — Inventory Management System

A full-stack inventory management system for tracking office electronics. Built with Next.js 14, Express, Prisma, and SQLite.

## Features

- **Device management** — add, edit, delete devices with custom fields per category
- **Personnel tracking** — manage staff and device assignments
- **Assignment history** — full audit log of device check-outs and returns
- **QR codes** — auto-generated QR code per device, links to a public info page
- **Public device page** — scan a QR code to view device details without logging in
- **Custom fields** — define per-category fields (text, number, date, boolean, dropdown, etc.)
- **Backup & restore** — download and restore the SQLite database
- **Mobile responsive** — works on phones and tablets

## Project Structure

```
ims2/
├── backend/          # Express + Prisma API (port 4000)
├── frontend/         # Next.js admin panel (port 3001)
└── public-app/       # Next.js public QR device page (port 3002)
```

## Tech Stack

| Layer       | Technology                          |
|-------------|-------------------------------------|
| Backend     | Node.js, Express, TypeScript        |
| ORM         | Prisma + SQLite                     |
| Admin UI    | Next.js 14, TailwindCSS, TanStack Query |
| Public UI   | Next.js 14, TailwindCSS             |
| Auth        | JWT (httpOnly cookies)              |

## Getting Started

### Prerequisites

- Node.js 18+
- npm

---

### Quick Start — Linux / macOS / WSL

```bash
# 1. Install dependencies, set up env files, run migrations
./setup.sh

# 2. Start all services (Ctrl+C to stop)
./start.sh
```

---

### Quick Start — Windows

> Requires [Node.js 18+](https://nodejs.org) installed and available in PATH.

```bat
:: 1. Install dependencies, set up env files, run migrations
setup.bat

:: 2. Start all services
start.bat
```

`start.bat` asks how you want to run the services:

| Mode | Description | How to stop |
|------|-------------|-------------|
| **[1] Terminal windows** | Each service opens in its own visible window | Close each window |
| **[2] Background (hidden)** | Services run silently with no visible window; logs saved to `.ims-run\` | Run `stop.bat` |

---

### Manual Setup

#### 1. Install dependencies

```bash
# Backend
cd backend && npm install

# Admin panel
cd frontend && npm install

# Public app
cd public-app && npm install
```

#### 2. Configure environment variables

**Backend** — copy and edit:
```bash
cp backend/.env.example backend/.env
```

| Variable         | Description                                              | Default                  |
|------------------|----------------------------------------------------------|--------------------------|
| `DATABASE_URL`   | SQLite file path (relative to `prisma/schema.prisma`)   | `file:./dev.db`          |
| `JWT_SECRET`     | Secret key for signing JWT tokens — **change this**     | —                        |
| `PORT`           | Backend API port                                         | `4000`                   |
| `ADMIN_PANEL_URL`| URL of the admin frontend (for CORS)                    | `http://localhost:3001`  |
| `PUBLIC_APP_URL` | Full URL of the public app for QR codes. Leave empty to auto-detect the server IP | `""` |
| `PUBLIC_APP_PORT`| Port of the public app (used when auto-detecting IP)    | `3002`                   |

**Frontend** — copy and edit:
```bash
cp frontend/.env.local.example frontend/.env.local
# Windows:
copy frontend\.env.local.example frontend\.env.local
```

**Public app** — copy and edit:
```bash
cp public-app/.env.local.example public-app/.env.local
# Windows:
copy public-app\.env.local.example public-app\.env.local
```

#### 3. Set up the database

```bash
cd backend
npx prisma migrate deploy
```

No seed data is needed. On first launch, the app will redirect to `/setup` where you create your admin account.

#### 4. Run the apps

Open three terminals:

```bash
# Terminal 1 — Backend API
cd backend && npm run dev

# Terminal 2 — Admin panel
cd frontend && npm run dev

# Terminal 3 — Public app (for QR codes)
cd public-app && npm run dev
```

| App          | URL                    |
|--------------|------------------------|
| Admin panel  | http://localhost:3001  |
| Public app   | http://localhost:3002  |
| API          | http://localhost:4000  |

## QR Codes

Each device gets a QR code that links to `http://<server-ip>:3002/device/<id>`. When scanned from another device on the same network, it opens the public device info page.

To make QR codes work over a local network:
- Leave `PUBLIC_APP_URL` empty in `backend/.env` — the server IP is auto-detected
- Or set it explicitly: `PUBLIC_APP_URL=http://192.168.1.100:3002`

## Database Backup

In the admin panel, go to **Settings → Backup** to download or restore the SQLite database.

## Development Scripts

```bash
# Backend
npm run dev          # Start with hot reload
npm run db:migrate   # Run pending migrations
npm run db:seed      # Re-run the seed
npm run db:studio    # Open Prisma Studio

# Frontend / Public app
npm run dev          # Start Next.js dev server
npm run build        # Production build
npm run start        # Start production server
```

## License

MIT
