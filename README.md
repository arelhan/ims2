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
npm run dev     # Start all services (terminal stays open)
```

Open http://localhost:3001 and create your admin account.

## Running on Windows

### Terminal mode (geliştirme)
```bash
npm run dev         # Tüm servisler bu terminalde çalışır, Ctrl+C ile durur
```

### Arka planda (terminal kapatılabilir)
```bash
npm run start:bg    # Servisleri arka planda başlat
npm run stop        # Durdur
```

### Bilgisayar açılışında otomatik başlat
Yönetici olarak bir terminal açın (cmd veya PowerShell → "Yönetici olarak çalıştır"):
```bash
npm run startup:register    # Windows Task Scheduler'a kaydet
npm run startup:unregister  # Kaydı kaldır
```

Kayıt sonrasında bilgisayar yeniden başlatılsa bile IMS otomatik olarak arka planda başlar.

### İnteraktif mod (menü)
```bash
npm start   # Terminal / Arka plan / Otomatik başlatma seçeneklerini gösterir
```

### Log dosyaları
Arka planda çalışırken loglar `.ims-run/` klasöründe tutulur:
```
.ims-run/
  backend.log
  frontend.log
  public-app.log
```

## License

MIT
