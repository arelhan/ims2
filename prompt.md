You are a senior full-stack developer. Build a complete, production-ready
**Office Electronics Inventory Management System** with a fully decoupled
backend and frontend architecture.

---

## ARCHITECTURE OVERVIEW
┌─────────────────────────────────────────────────────────┐
│                    MONOREPO ROOT                         │
│                                                         │
│  ┌──────────────────┐      ┌──────────────────────────┐ │
│  │   /backend       │      │   /frontend              │ │
│  │   Node.js +      │◄────►│   Next.js 14             │ │
│  │   Express +      │ REST │   (Admin Panel Only)     │ │
│  │   Prisma +       │ API  │                          │ │
│  │   SQLite         │      └──────────────────────────┘ │
│  └──────────────────┘                                   │
│           │                ┌──────────────────────────┐ │
│           │                │   /public-app            │ │
│           └───────────────►│   Next.js 14             │ │
│                REST API    │   (QR Scan Page Only)    │ │
│                            │   No login required      │ │
│                            └──────────────────────────┘ │
└─────────────────────────────────────────────────────────┘

### Three separate apps in one monorepo:

| App | Path | Purpose | Auth |
|-----|------|---------|------|
| **Backend API** | `/backend` | Express REST API + Prisma ORM | JWT tokens |
| **Admin Panel** | `/frontend` | Full dashboard for ADMIN users | Required (ADMIN role) |
| **Public App** | `/public-app` | QR scan device info page | None (public) |

---

## TECH STACK

### Backend (`/backend`)
- **Runtime**: Node.js 20 + TypeScript
- **Framework**: Express.js
- **ORM**: Prisma with SQLite (swappable to PostgreSQL)
- **Auth**: JWT (jsonwebtoken) + bcryptjs
- **QR Code**: `qrcode` npm package
- **File upload**: `multer` (for DB restore)
- **Validation**: `zod`
- **Structure**: Controllers → Services → Prisma

### Frontend — Admin Panel (`/frontend`)
- **Framework**: Next.js 14 (App Router) + TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **State / Data**: TanStack Query v5
- **Auth**: JWT stored in httpOnly cookie, verified client-side
- **Icons**: Lucide React
- **HTTP Client**: axios with interceptors

### Public App — QR Page (`/public-app`)
- **Framework**: Next.js 14 (App Router) + TypeScript
- **Styling**: Tailwind CSS
- **No auth, no login, no navigation**
- Single purpose: display device info by ID
- Accessible by anyone who scans a QR code

---

## MONOREPO STRUCTURE
inventory-system/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── auth.controller.ts
│   │   │   ├── device.controller.ts
│   │   │   ├── category.controller.ts
│   │   │   ├── brand.controller.ts
│   │   │   ├── personnel.controller.ts
│   │   │   ├── assignment.controller.ts
│   │   │   ├── user.controller.ts
│   │   │   └── backup.controller.ts
│   │   ├── services/
│   │   │   ├── auth.service.ts
│   │   │   ├── device.service.ts
│   │   │   ├── category.service.ts
│   │   │   ├── brand.service.ts
│   │   │   ├── personnel.service.ts
│   │   │   ├── assignment.service.ts
│   │   │   ├── user.service.ts
│   │   │   └── backup.service.ts
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts       ← verifyToken
│   │   │   ├── admin.middleware.ts      ← requireAdmin
│   │   │   └── error.middleware.ts
│   │   ├── routes/
│   │   │   ├── auth.routes.ts
│   │   │   ├── device.routes.ts
│   │   │   ├── category.routes.ts
│   │   │   ├── brand.routes.ts
│   │   │   ├── personnel.routes.ts
│   │   │   ├── assignment.routes.ts
│   │   │   ├── user.routes.ts
│   │   │   ├── backup.routes.ts
│   │   │   └── public.routes.ts        ← no auth
│   │   ├── lib/
│   │   │   ├── prisma.ts
│   │   │   ├── jwt.ts
│   │   │   └── qr.ts
│   │   └── index.ts                    ← Express app entry
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.ts
│   ├── uploads/                        ← multer temp dir
│   ├── .env
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/                           ← ADMIN PANEL
│   ├── src/
│   │   ├── app/
│   │   │   ├── (auth)/
│   │   │   │   └── login/page.tsx
│   │   │   └── (dashboard)/
│   │   │       ├── layout.tsx
│   │   │       ├── page.tsx            ← dashboard
│   │   │       ├── devices/
│   │   │       ├── personnel/
│   │   │       ├── assignments/
│   │   │       └── settings/
│   │   │           ├── page.tsx        ← tabs: categories/fields/brands/users
│   │   │           └── backup/page.tsx
│   │   ├── components/
│   │   ├── lib/
│   │   │   ├── api.ts                  ← axios instance pointing to backend
│   │   │   └── auth.ts                 ← JWT cookie helpers
│   │   └── middleware.ts               ← Next.js route protection
│   ├── .env.local
│   ├── package.json
│   └── tsconfig.json
│
├── public-app/                         ← QR SCAN APP (no auth)
│   ├── src/
│   │   └── app/
│   │       ├── layout.tsx              ← minimal layout, no nav
│   │       ├── page.tsx                ← 404 / redirect
│   │       └── device/
│   │           └── [id]/
│   │               └── page.tsx        ← QR landing page
│   ├── .env.local
│   ├── package.json
│   └── tsconfig.json
│
├── package.json                        ← root workspace scripts
└── README.md

---

## DATABASE SCHEMA (Prisma)
```prisma
// backend/prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model User {
  id           String   @id @default(cuid())
  name         String
  email        String   @unique
  passwordHash String
  role         UserRole @default(VIEWER)
  createdAt    DateTime @default(now())
}

model Device {
  id           String       @id @default(cuid())
  name         String
  serialNumber String       @unique
  categoryId   String
  brandId      String?
  status       DeviceStatus @default(IN_WAREHOUSE)
  purchaseDate DateTime?
  notes        String?
  qrCodeUrl    String?
  createdAt    DateTime     @default(now())
  updatedAt    DateTime     @updatedAt

  category     Category      @relation(fields: [categoryId], references: [id])
  brand        Brand?        @relation(fields: [brandId], references: [id])
  assignments  Assignment[]
  customValues CustomValue[]
}

model Category {
  id           String        @id @default(cuid())
  name         String        @unique
  description  String?
  createdAt    DateTime      @default(now())
  devices      Device[]
  customFields CustomField[]
}

model CustomField {
  id          String      @id @default(cuid())
  categoryId  String
  label       String
  fieldKey    String
  fieldType   FieldType   @default(TEXT)
  isRequired  Boolean     @default(false)
  placeholder String?
  order       Int         @default(0)
  createdAt   DateTime    @default(now())

  category Category      @relation(fields: [categoryId], references: [id])
  values   CustomValue[]

  @@unique([categoryId, fieldKey])
}

model CustomValue {
  id            String @id @default(cuid())
  deviceId      String
  customFieldId String
  value         String

  device      Device      @relation(fields: [deviceId], references: [id], onDelete: Cascade)
  customField CustomField @relation(fields: [customFieldId], references: [id], onDelete: Cascade)

  @@unique([deviceId, customFieldId])
}

model Brand {
  id        String   @id @default(cuid())
  name      String   @unique
  createdAt DateTime @default(now())
  devices   Device[]
}

model Personnel {
  id          String       @id @default(cuid())
  name        String
  email       String       @unique
  department  String
  phone       String?
  createdAt   DateTime     @default(now())
  assignments Assignment[]
}

model Assignment {
  id          String    @id @default(cuid())
  deviceId    String
  personnelId String
  assignedAt  DateTime  @default(now())
  returnedAt  DateTime?
  notes       String?
  isActive    Boolean   @default(true)

  device    Device    @relation(fields: [deviceId], references: [id])
  personnel Personnel @relation(fields: [personnelId], references: [id])
}

enum DeviceStatus {
  IN_WAREHOUSE
  ASSIGNED
  MAINTENANCE
  RETIRED
}

enum FieldType {
  TEXT
  NUMBER
  DATE
  BOOLEAN
}

enum UserRole {
  ADMIN
  VIEWER
}
```

---

## BACKEND — EXPRESS API

### Entry point
```typescript
// backend/src/index.ts
import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import authRoutes from './routes/auth.routes'
import deviceRoutes from './routes/device.routes'
import categoryRoutes from './routes/category.routes'
import brandRoutes from './routes/brand.routes'
import personnelRoutes from './routes/personnel.routes'
import assignmentRoutes from './routes/assignment.routes'
import userRoutes from './routes/user.routes'
import backupRoutes from './routes/backup.routes'
import publicRoutes from './routes/public.routes'
import { errorMiddleware } from './middleware/error.middleware'

const app = express()

app.use(cors({
  origin: [
    process.env.ADMIN_PANEL_URL!,   // e.g. http://localhost:3001
    process.env.PUBLIC_APP_URL!,    // e.g. http://localhost:3002
  ],
  credentials: true,
}))
app.use(express.json())
app.use(cookieParser())

// Public routes — no auth
app.use('/api/public', publicRoutes)

// Auth
app.use('/api/auth', authRoutes)

// Protected routes (JWT required)
app.use('/api/devices', deviceRoutes)
app.use('/api/categories', categoryRoutes)
app.use('/api/brands', brandRoutes)
app.use('/api/personnel', personnelRoutes)
app.use('/api/assignments', assignmentRoutes)

// Admin-only routes
app.use('/api/admin/users', userRoutes)
app.use('/api/admin/backup', backupRoutes)

app.use(errorMiddleware)
app.listen(process.env.PORT || 4000)
```

### Middleware
```typescript
// backend/src/middleware/auth.middleware.ts
import jwt from 'jsonwebtoken'
import { Request, Response, NextFunction } from 'express'

export interface AuthRequest extends Request {
  user?: { id: string; role: 'ADMIN' | 'VIEWER' }
}

export function verifyToken(req: AuthRequest, res: Response, next: NextFunction) {
  const token = req.cookies?.token || req.headers.authorization?.split(' ')[1]
  if (!token) return res.status(401).json({ error: 'Unauthorized' })
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET!) as any
    next()
  } catch {
    res.status(401).json({ error: 'Invalid token' })
  }
}

// backend/src/middleware/admin.middleware.ts
export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (req.user?.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Forbidden: Admin access required' })
  }
  next()
}
```

### Public routes (no auth — QR scan)
```typescript
// backend/src/routes/public.routes.ts
// These endpoints are consumed by /public-app only
// No JWT required whatsoever

router.get('/devices/:id', publicController.getDeviceById)
// Returns: device info + category + brand + current assignment
//          + custom fields with values
// Does NOT return: internal notes, audit logs, other devices
```

### All API routes
// ─── PUBLIC (no auth) ───────────────────────────────────────
GET  /api/public/devices/:id          ← QR scan landing data
// ─── AUTH ───────────────────────────────────────────────────
POST /api/auth/login                  ← returns JWT in httpOnly cookie
POST /api/auth/logout
GET  /api/auth/me
// ─── DEVICES (JWT required) ─────────────────────────────────
GET    /api/devices                   ← ADMIN
GET    /api/devices/:id               ← ADMIN
POST   /api/devices                   ← ADMIN (generates QR on creation)
PUT    /api/devices/:id               ← ADMIN
DELETE /api/devices/:id               ← ADMIN
// ─── CATEGORIES (JWT + ADMIN) ───────────────────────────────
GET    /api/categories                ← ADMIN
POST   /api/categories                ← ADMIN
PUT    /api/categories/:id            ← ADMIN
DELETE /api/categories/:id            ← ADMIN
// ─── CUSTOM FIELDS (JWT + ADMIN) ────────────────────────────
GET    /api/categories/:id/fields     ← ADMIN
POST   /api/categories/:id/fields     ← ADMIN
PUT    /api/categories/:id/fields/:fid ← ADMIN
DELETE /api/categories/:id/fields/:fid ← ADMIN
PATCH  /api/categories/:id/fields/reorder ← ADMIN (drag-to-reorder)
// ─── BRANDS (JWT + ADMIN) ───────────────────────────────────
GET    /api/brands                    ← ADMIN
POST   /api/brands                    ← ADMIN
PUT    /api/brands/:id                ← ADMIN
DELETE /api/brands/:id                ← ADMIN
// ─── PERSONNEL (JWT + ADMIN) ────────────────────────────────
GET    /api/personnel                 ← ADMIN
GET    /api/personnel/:id             ← ADMIN
POST   /api/personnel                 ← ADMIN
PUT    /api/personnel/:id             ← ADMIN
DELETE /api/personnel/:id             ← ADMIN
// ─── ASSIGNMENTS (JWT + ADMIN) ──────────────────────────────
GET    /api/assignments               ← ADMIN
POST   /api/assignments               ← ADMIN
PATCH  /api/assignments/:id/return    ← ADMIN
// ─── ADMIN: USERS (JWT + ADMIN) ─────────────────────────────
GET    /api/admin/users               ← ADMIN
POST   /api/admin/users               ← ADMIN
PATCH  /api/admin/users/:id           ← ADMIN
DELETE /api/admin/users/:id           ← ADMIN
// ─── ADMIN: BACKUP (JWT + ADMIN) ────────────────────────────
GET    /api/admin/backup/download     ← ADMIN → streams .db file
POST   /api/admin/backup/restore      ← ADMIN → uploads .db file
// ─── DASHBOARD (JWT + ADMIN) ────────────────────────────────
GET    /api/dashboard/stats

### QR Code generation
```typescript
// backend/src/lib/qr.ts
import QRCode from 'qrcode'

export async function generateDeviceQR(deviceId: string): Promise<string> {
  // QR points to the PUBLIC app, not the admin panel
  const url = `${process.env.PUBLIC_APP_URL}/device/${deviceId}`
  return QRCode.toDataURL(url, {
    width: 300,
    margin: 2,
    color: { dark: '#0f172a', light: '#ffffff' },
    errorCorrectionLevel: 'M',
  })
}
// Called automatically in device.service.ts → createDevice()
// Saved as base64 data URL in device.qrCodeUrl field
```

### Backup & Restore
```typescript
// backend/src/services/backup.service.ts
import fs from 'fs'
import path from 'path'

const DB_PATH = path.join(process.cwd(), 'prisma/dev.db')

export function downloadBackup(): Buffer {
  return fs.readFileSync(DB_PATH)
}

export function restoreBackup(fileBuffer: Buffer): void {
  // 1. Validate SQLite magic bytes
  const magic = fileBuffer.slice(0, 6).toString('ascii')
  if (magic !== 'SQLite') throw new Error('Invalid SQLite file')

  // 2. Auto-backup current DB before overwrite
  const safePath = DB_PATH.replace('.db', `-pre-restore-${Date.now()}.db`)
  fs.copyFileSync(DB_PATH, safePath)

  // 3. Write new DB
  fs.writeFileSync(DB_PATH, fileBuffer)
}

// backend/src/controllers/backup.controller.ts
export async function download(req, res) {
  const buffer = backupService.downloadBackup()
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  res.setHeader('Content-Type', 'application/octet-stream')
  res.setHeader('Content-Disposition', `attachment; filename="backup-${timestamp}.db"`)
  res.send(buffer)
}

export async function restore(req, res) {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' })
  backupService.restoreBackup(req.file.buffer)
  res.json({ success: true, message: 'Database restored successfully' })
}
```

---

## FRONTEND — ADMIN PANEL (`/frontend`)

### Access rules
- **Only ADMIN users can log in and use the admin panel**
- VIEWER role users who attempt to log in receive:
  `403: "Access denied. Admin privileges required."`
- Middleware redirects unauthenticated requests to `/login`
```typescript
// frontend/src/middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value
  const isLoginPage = request.nextUrl.pathname === '/login'

  if (!token && !isLoginPage) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  if (token && isLoginPage) {
    return NextResponse.redirect(new URL('/', request.url))
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
```
```typescript
// frontend/src/lib/api.ts
import axios from 'axios'

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL, // http://localhost:4000/api
  withCredentials: true,                    // send httpOnly cookies
})

// Auto-logout on 401
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api
```

### Admin Panel Pages
/login                      Sign in (ADMIN only)
/                           Dashboard: stats, recent activity, charts
/devices                    Device list + filters + search
/devices/new                Add device form (dynamic custom fields)
/devices/[id]               Device detail (admin view — shows all data)
/devices/[id]/edit          Edit device
/personnel                  Personnel list
/personnel/[id]             Personnel detail + assigned devices
/assignments                Full assignment audit log
/settings                   Tabbed settings page:
Tab 1: Categories          Add/rename/delete categories
Tab 2: Custom Fields       Select category → add/edit/delete/reorder fields
Tab 3: Brands              Add/rename/delete brands
Tab 4: Users               Manage user accounts and roles
/settings/backup            Backup download + restore UI

---

## PUBLIC APP — QR SCAN (`/public-app`)

### Purpose
- **Single-purpose app**: only exists to show device info when someone scans a QR code
- No login, no navigation, no sidebar
- No access to any other data — only the scanned device's info
- Designed to look clean and informative on a mobile phone screen

### What non-admin users (and anyone) can see after scanning:
```typescript
// public-app/src/app/device/[id]/page.tsx
// Calls: GET /api/public/devices/:id  (no auth required)

// Displayed information:
// ✅ Device name, category, brand
// ✅ Serial number
// ✅ Current status (IN WAREHOUSE / ASSIGNED / MAINTENANCE)
// ✅ If ASSIGNED → shows: assigned person's name and department
// ✅ All custom field values (e.g. Domain Name, OS Version, RAM)
// ✅ QR code image (so user can share or re-print)
//
// ❌ NOT shown: notes, purchase date, price, assignment history,
//              other devices, personnel contact info
```

### Public device page design
┌─────────────────────────────────────┐
│  [Company Logo]                     │
│                                     │
│  MacBook Pro 14                     │
│  Apple  ·  Laptop                   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │  ● ASSIGNED                 │   │
│  │  John Smith — IT Dept.      │   │
│  └─────────────────────────────┘   │
│                                     │
│  SPECIFICATIONS                     │
│  Serial No.    MBP-2023-001        │
│  OS Version    macOS Sonoma 14.4   │
│  RAM           16 GB               │
│  Domain        company.local       │
│                                     │
│  ┌──────────┐                      │
│  │ QR Code  │                      │
│  └──────────┘                      │
│  [Download QR]                     │
└─────────────────────────────────────┘

### Backend public endpoint (what it returns)
```typescript
// backend/src/controllers/public.controller.ts
// GET /api/public/devices/:id

const device = await prisma.device.findUnique({
  where: { id: params.id },
  select: {
    id: true,
    name: true,
    serialNumber: true,
    status: true,
    qrCodeUrl: true,
    category: { select: { name: true } },
    brand: { select: { name: true } },
    customValues: {
      select: {
        value: true,
        customField: { select: { label: true, order: true } }
      },
      orderBy: { customField: { order: 'asc' } }
    },
    assignments: {
      where: { isActive: true },
      select: {
        assignedAt: true,
        personnel: {
          select: { name: true, department: true }  // NO email/phone
        }
      },
      take: 1
    }
    // ← NO notes, purchaseDate, updatedAt, history, other fields
  }
})
```

---

## QR CODE FLOW (end-to-end)

Admin creates a device in /frontend
│
▼
POST /api/devices → device.service.ts
→ generateDeviceQR(device.id) is called
→ QR encodes: https://public-app.company.com/device/{id}
→ QR saved as base64 in device.qrCodeUrl
│
▼
Admin prints QR and sticks it on the physical device
│
▼
Anyone scans QR with phone camera
│
▼
Browser opens: https://public-app.company.com/device/{id}
→ No login prompt, no redirect
→ Fetches GET /api/public/devices/{id}
→ Shows clean device info card


---

## SEED DATA
```typescript
// backend/prisma/seed.ts

// Users
// admin@company.com  password: admin123  role: ADMIN
// viewer@company.com password: view123   role: VIEWER
//   (VIEWER cannot log into admin panel — only QR pages are accessible to them)

// Brands: Apple, Dell, HP, Logitech, Samsung, Lenovo

// Categories + Custom Fields:
// Laptop    → OS Version, RAM, Storage, Domain Name, Processor
// Monitor   → Screen Size, Resolution, Panel Type
// Phone     → IMEI, Carrier, OS Version
// Network   → IP Address, MAC Address, Firmware Version
// Printer   → IP Address, Model Number, Toner Type

// 5 Personnel across IT / Finance / Marketing
// 15 Devices across all categories with custom values
// 8 active assignments + 10 historical
```

---

## ENVIRONMENT VARIABLES
```bash
# backend/.env
DATABASE_URL="file:./prisma/dev.db"
JWT_SECRET="your-super-secret-jwt-key"
PORT=4000
ADMIN_PANEL_URL="http://localhost:3001"
PUBLIC_APP_URL="http://localhost:3002"

# frontend/.env.local
NEXT_PUBLIC_API_URL="http://localhost:4000/api"

# public-app/.env.local
NEXT_PUBLIC_API_URL="http://localhost:4000/api"
```

---

## GETTING STARTED
```bash
# 1. Root setup
mkdir inventory-system && cd inventory-system
npm init -y
# Configure package.json workspaces:
# "workspaces": ["backend", "frontend", "public-app"]

# 2. Backend
mkdir backend && cd backend
npm init -y
npm install express prisma @prisma/client jsonwebtoken bcryptjs
npm install qrcode multer zod cors cookie-parser
npm install -D typescript @types/express @types/node ts-node nodemon
npx prisma init --datasource-provider sqlite
# → Paste schema, then:
npx prisma migrate dev --name init
npx prisma db seed
cd ..

# 3. Admin Panel
npx create-next-app@latest frontend --typescript --tailwind --app
cd frontend
npx shadcn@latest init
npm install @tanstack/react-query axios
cd ..

# 4. Public App
npx create-next-app@latest public-app --typescript --tailwind --app
cd public-app

# 5. Run all three
# Terminal 1: cd backend && npm run dev     → :4000
# Terminal 2: cd frontend && npm run dev    → :3001
# Terminal 3: cd public-app && npm run dev  → :3002
```

---

## BUILD ORDER

Build in this exact sequence:
1. **Prisma schema** → migrate → seed
2. **Backend middleware** (JWT verify, requireAdmin)
3. **Backend routes** starting with `/api/public/devices/:id`
4. **Auth** (login endpoint, cookie flow)
5. **All admin API routes** (devices, categories, fields, brands, personnel)
6. **Backup/restore** endpoints
7. **Public App** (`/public-app`) — device info page only
8. **Admin Panel** (`/frontend`) — login → dashboard → all pages
9. **Settings tabs** (categories, custom fields, brands, users)
10. **Backup UI**
11. **Polish**: loading skeletons, empty states, mobile layout, toasts

---

## EXTENSIBILITY NOTES (future phases)

- **PostgreSQL**: swap Prisma datasource, run `prisma migrate deploy`
- **Docker Compose**: containerize all three apps + reverse proxy with Nginx
- **Email notifications**: nodemailer when device is assigned/returned
- **PDF export**: `@react-pdf/renderer` for device lists and assignment reports
- **CSV import**: bulk device registration via spreadsheet
- **Mobile QR scanner**: `html5-qrcode` camera scanning in public-app
- **Maintenance logs**: timestamped per-session notes
- **Depreciation**: purchase price + calculated book value
- **Multi-tenant**: company-scoped data with subdomain routing