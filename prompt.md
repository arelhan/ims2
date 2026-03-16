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
- **Styling**: Tailwind CSS
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
ims2/
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
│   │   │   ├── auth.routes.ts           ← login, logout, me, change-password, forgot-password, reset-password
│   │   │   ├── setup.routes.ts          ← GET /status, POST / (first-run wizard)
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
│   │   └── index.ts                    ← Express app entry (listens 0.0.0.0, shows Network IP)
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── seed.ts                     ← no-op (setup wizard handles first admin)
│   │   └── migrations/
│   ├── .env                            ← created by setup.sh from .env.example
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/                           ← ADMIN PANEL
│   ├── src/
│   │   ├── app/
│   │   │   ├── login/
│   │   │   │   ├── page.tsx            ← server component: checks setup status, redirects if needed
│   │   │   │   └── LoginForm.tsx       ← client form (username + password)
│   │   │   ├── setup/
│   │   │   │   ├── page.tsx            ← server component: redirects to /login if already setup
│   │   │   │   └── SetupForm.tsx       ← client form (name + username + password)
│   │   │   ├── forgot-password/
│   │   │   │   └── page.tsx            ← enter username → get reset code shown on screen
│   │   │   ├── reset-password/
│   │   │   │   └── page.tsx            ← enter username + code + new password
│   │   │   └── (dashboard)/
│   │   │       ├── layout.tsx          ← client layout with mobile sidebar
│   │   │       ├── page.tsx            ← dashboard
│   │   │       ├── devices/
│   │   │       ├── personnel/
│   │   │       ├── assignments/
│   │   │       └── settings/
│   │   │           ├── page.tsx        ← tabs: categories / fields / users / account
│   │   │           ├── CategoriesTab.tsx
│   │   │           ├── CustomFieldsTab.tsx
│   │   │           ├── UsersTab.tsx    ← username field, inline admin password reset
│   │   │           ├── AccountTab.tsx  ← change own password
│   │   │           └── backup/page.tsx
│   │   ├── components/
│   │   │   ├── layout/Sidebar.tsx      ← mobile drawer + desktop static
│   │   │   └── CustomFieldInput.tsx    ← shared field renderer
│   │   ├── lib/
│   │   │   ├── api.ts
│   │   │   └── utils.ts
│   │   └── middleware.ts               ← protects routes; public: /login /setup /forgot-password /reset-password
│   ├── .env.local                      ← created by setup.sh
│   ├── .env.local.example
│   ├── package.json
│   └── tsconfig.json
│
├── public-app/                         ← QR SCAN APP (no auth)
│   ├── src/
│   │   └── app/
│   │       ├── layout.tsx
│   │       ├── page.tsx
│   │       └── device/[id]/page.tsx    ← QR landing page
│   ├── .env.local                      ← created by setup.sh
│   ├── .env.local.example
│   ├── package.json
│   └── tsconfig.json
│
├── setup.sh                            ← full setup: checks Linux Node via nvm, creates .env files, parallel npm install, migration
├── start.sh                            ← starts all 3 apps in one terminal with color-prefixed logs
├── stop.sh                             ← stops all running apps via saved PIDs
├── .gitignore
├── .gitattributes                      ← forces LF line endings (important for WSL)
└── README.md

---

## DATABASE SCHEMA (Prisma — current)
```prisma
model User {
  id               String    @id @default(cuid())
  name             String
  username         String    @unique          // ← login identifier (no email)
  passwordHash     String
  role             String    @default("VIEWER")
  createdAt        DateTime  @default(now())
  resetCode        String?                    // ← 6-char code for password reset
  resetCodeExpiry  DateTime?                  // ← valid 15 minutes
}

model Device {
  id           String    @id @default(cuid())
  name         String
  serialNumber String    @unique
  categoryId   String
  brandId      String?
  status       String    @default("IN_WAREHOUSE")
  purchaseDate DateTime?
  notes        String?
  qrCodeUrl    String?
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

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
  id          String   @id @default(cuid())
  categoryId  String
  label       String
  fieldKey    String
  fieldType   String   @default("TEXT")   // TEXT | TEXTAREA | NUMBER | DATE | BOOLEAN | EMAIL | PHONE | SELECT
  isRequired  Boolean  @default(false)
  placeholder String?                     // for SELECT type: stores comma-separated options
  order       Int      @default(0)
  createdAt   DateTime @default(now())

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

  device    Device    @relation(fields: [deviceId], references: [id], onDelete: Cascade)
  personnel Personnel @relation(fields: [personnelId], references: [id], onDelete: Cascade)
}
```

---

## ALL API ROUTES

```
// ─── PUBLIC (no auth) ────────────────────────────────────────
GET  /api/public/devices/:id          ← QR scan landing data

// ─── SETUP (no auth) ─────────────────────────────────────────
GET  /api/setup/status                ← { needsSetup: boolean }
POST /api/setup                       ← create first admin (403 if users exist)

// ─── AUTH ────────────────────────────────────────────────────
POST /api/auth/login                  ← { username, password } → JWT cookie
POST /api/auth/logout
GET  /api/auth/me
POST /api/auth/change-password        ← { currentPassword, newPassword } (JWT required)
POST /api/auth/forgot-password        ← { username } → { resetCode } (shown on screen)
POST /api/auth/reset-password         ← { username, code, newPassword }

// ─── DEVICES (JWT required) ──────────────────────────────────
GET    /api/devices
GET    /api/devices/:id
POST   /api/devices                   ← generates QR on creation
PUT    /api/devices/:id
DELETE /api/devices/:id

// ─── CATEGORIES (JWT + ADMIN) ────────────────────────────────
GET    /api/categories
POST   /api/categories
PUT    /api/categories/:id
DELETE /api/categories/:id

// ─── CUSTOM FIELDS (JWT + ADMIN) ─────────────────────────────
GET    /api/categories/:id/fields
POST   /api/categories/:id/fields
PUT    /api/categories/:id/fields/:fid
DELETE /api/categories/:id/fields/:fid
PATCH  /api/categories/:id/fields/reorder

// ─── BRANDS (JWT + ADMIN) ────────────────────────────────────
GET    /api/brands
POST   /api/brands
PUT    /api/brands/:id
DELETE /api/brands/:id

// ─── PERSONNEL (JWT + ADMIN) ─────────────────────────────────
GET    /api/personnel
GET    /api/personnel/:id
POST   /api/personnel
PUT    /api/personnel/:id
DELETE /api/personnel/:id

// ─── ASSIGNMENTS (JWT + ADMIN) ───────────────────────────────
GET    /api/assignments
POST   /api/assignments
PATCH  /api/assignments/:id/return

// ─── ADMIN: USERS (JWT + ADMIN) ──────────────────────────────
GET    /api/admin/users
POST   /api/admin/users               ← { name, username, password, role }
PATCH  /api/admin/users/:id           ← can update name/username/password/role
DELETE /api/admin/users/:id           ← blocked if last admin

// ─── ADMIN: BACKUP (JWT + ADMIN) ─────────────────────────────
GET    /api/admin/backup/download
POST   /api/admin/backup/restore

// ─── DASHBOARD (JWT + ADMIN) ─────────────────────────────────
GET    /api/dashboard/stats
```

---

## FRONTEND PAGES

```
/login                      Sign in with username + password (ADMIN only)
                            → Server component: redirects to /setup if no users exist
/setup                      First-run wizard: create admin account (name, username, password)
                            → Server component: redirects to /login if already set up
/forgot-password            Enter username → 6-char reset code shown on screen (15 min valid)
/reset-password             Enter username + reset code + new password
/                           Dashboard: device counts, assignment stats
/devices                    Device list + filters + search
/devices/new                Add device form (dynamic custom fields per category)
/devices/[id]               Device detail (all data, QR code, assignment history)
/devices/[id]/edit          Edit device
/personnel                  Personnel list
/personnel/[id]             Personnel detail + assigned devices
/assignments                Full assignment audit log
/settings                   Tabbed settings:
  Tab: Categories           Add/rename/delete categories
  Tab: Custom Fields        Per-category fields (label auto-generates fieldKey)
                            Field types: TEXT, TEXTAREA, NUMBER, DATE, BOOLEAN, EMAIL, PHONE, SELECT
                            SELECT stores comma-separated options in placeholder column
  Tab: Users                Manage users (username-based); inline admin password reset;
                            last admin cannot be deleted
  Tab: Account              Change own password (current + new + confirm)
/settings/backup            Download / restore SQLite database
```

---

## AUTH FLOW

### Login
- Username + password (no email)
- JWT stored in httpOnly cookie (7 days)
- Only ADMIN role can log in to admin panel

### Setup Wizard (first run)
- `GET /api/setup/status` → `{ needsSetup: true }` when DB has 0 users
- Login page (server component) calls this; redirects to `/setup` before rendering
- `POST /api/setup` creates first ADMIN and is blocked thereafter (403)

### Password Reset (no email server — local network app)
1. User goes to `/forgot-password`, enters username
2. Backend generates 6-char alphanumeric code, stores with 15-min expiry
3. Code is displayed on screen — user notes it down
4. User goes to `/reset-password`, enters username + code + new password
5. Code is invalidated after use

### Change Password
- Settings → Account tab → current password + new password

### Admin Reset
- Settings → Users → 🔑 button next to any user → set new password inline

---

## CUSTOM FIELD TYPES

| Type | UI | Notes |
|------|----|-------|
| TEXT | `<input type="text">` | default |
| TEXTAREA | `<textarea>` | multi-line |
| NUMBER | `<input type="number">` | |
| DATE | `<input type="date">` | |
| BOOLEAN | `<input type="checkbox">` | displays Yes/No in public app |
| EMAIL | `<input type="email">` | |
| PHONE | `<input type="tel">` | |
| SELECT | `<select>` | options stored as comma-separated string in `placeholder` column |

`fieldKey` is auto-generated from label (lowercase, spaces→underscores). No manual input.

---

## SETUP & DEPLOYMENT

### Prerequisites
- Running on Linux / WSL2 (Debian recommended)
- `curl` (installed automatically if missing)
- Node.js 18+ — installed automatically via nvm if missing or if Windows npm is detected in PATH

### First-time setup
```bash
chmod +x setup.sh start.sh stop.sh
./setup.sh
```

`setup.sh` does:
1. Detects Windows npm in WSL PATH and installs Linux Node.js 20 via nvm if needed
2. Creates `.env` / `.env.local` files from examples (auto-generates `JWT_SECRET`)
3. Runs `npm install` in all 3 packages **in parallel**
4. Runs `npx prisma migrate deploy`

### Running
```bash
./start.sh   # starts backend + frontend + public-app, color-coded logs in one terminal
./stop.sh    # stops all services (from another terminal)
# or Ctrl+C in start.sh terminal
```

### WSL2 — network access from other devices
Add to `C:\Users\<you>\.wslconfig`:
```ini
[wsl2]
networkingMode=mirrored
```
Then run `wsl --shutdown` and reopen WSL.
Also allow ports in Windows Firewall (run as Admin):
```powershell
New-NetFirewallRule -DisplayName "IMS App" -Direction Inbound -Protocol TCP -LocalPort 3001,3002,4000 -Action Allow
```
After this, `start.sh` displays the LAN IP and all devices on the network can access the app.

### Line endings (Windows/WSL)
`.gitattributes` enforces LF for all text files, CRLF for `.bat`/`.cmd`.
After cloning on Windows: `git add --renormalize .`

---

## ENVIRONMENT VARIABLES

```bash
# backend/.env
DATABASE_URL="file:./dev.db"
JWT_SECRET="<auto-generated by setup.sh>"
PORT=4000
ADMIN_PANEL_URL="http://localhost:3001"
PUBLIC_APP_URL=""          # leave empty to auto-detect server LAN IP for QR codes
PUBLIC_APP_PORT=3002

# frontend/.env.local
NEXT_PUBLIC_API_URL=http://localhost:4000/api
BACKEND_URL=http://localhost:4000    # server-side fetch (setup status check)

# public-app/.env.local
NEXT_PUBLIC_API_URL=/api
BACKEND_URL=http://localhost:4000
```

---

## DESIGN SYSTEM

- All cards: `rounded-2xl` + `border border-slate-200`
- Inputs: `rounded-xl` + `focus:ring-2 focus:ring-slate-900`
- Primary button: `bg-slate-900 text-white rounded-xl hover:bg-slate-800`
- Responsive: mobile-first; sidebar is a slide-in drawer on mobile (`lg:static`)
- Tables hidden on mobile → replaced with card lists (`hidden md:block` / `md:hidden`)
- Responsive grid: `grid-cols-1 sm:grid-cols-2`

---

## EXTENSIBILITY NOTES (future phases)

- **PostgreSQL**: swap Prisma datasource, run `prisma migrate deploy`
- **Docker Compose**: containerize all three apps + Nginx reverse proxy
- **Email notifications**: nodemailer when device is assigned/returned
- **PDF export**: `@react-pdf/renderer` for device lists and reports
- **CSV import**: bulk device registration via spreadsheet
- **Mobile QR scanner**: `html5-qrcode` in public-app
- **Maintenance logs**: timestamped per-session notes
- **Depreciation**: purchase price + calculated book value
- **Multi-tenant**: company-scoped data with subdomain routing
