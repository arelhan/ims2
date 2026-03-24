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
npm run dev     # Start all services
```

Open http://localhost:3001 and create your admin account.

## License

MIT
