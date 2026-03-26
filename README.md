# IMS — Inventory Management System

Office electronics tracking system. Built with Next.js 14, Express, Prisma, and SQLite.

## Features

- Device management with custom fields per category
- Personnel tracking and device assignments
- Assignment history (audit log)
- QR codes linking to public device info pages
- Backup & restore (SQLite)
- Mobile responsive

## Project Structure

```
ims2/
├── backend/      # Express + Prisma API (port 4000)
├── frontend/     # Next.js admin panel (port 3001)
└── public-app/   # Next.js public device page (port 3002)
```

## Tech Stack

| Layer    | Technology                              |
|----------|-----------------------------------------|
| Backend  | Node.js, Express, TypeScript, Prisma, SQLite |
| Frontend | Next.js 14, TailwindCSS, TanStack Query |
| Auth     | JWT (httpOnly cookies)                  |

## Quick Start

Requires **Node.js 18+**.

```bash
npm run setup   # Install deps, configure env, run migrations
npm run dev     # Start all services (backend, frontend, public-app)
```

Open http://localhost:3001 and create your admin account.

## Commands

```bash
npm run dev     # Start all 3 services in one terminal (Ctrl+C to stop)
npm start       # Same as npm run dev
npm run stop    # Kill any running services (ports 3001, 3002, 4000)
npm run setup   # First-time setup (install deps, env files, migrations)
```

## License

MIT
