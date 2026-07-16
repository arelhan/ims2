import 'dotenv/config'
import { config } from './lib/config'
import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import os from 'os'

import authRoutes from './routes/auth.routes'
import deviceRoutes from './routes/device.routes'
import categoryRoutes from './routes/category.routes'
import brandRoutes from './routes/brand.routes'
import personnelRoutes from './routes/personnel.routes'
import departmentRoutes from './routes/department.routes'
import assignmentRoutes from './routes/assignment.routes'
import userRoutes from './routes/user.routes'
import backupRoutes from './routes/backup.routes'
import publicRoutes from './routes/public.routes'
import setupRoutes from './routes/setup.routes'
import { getServerIP } from './lib/qr'
import { errorMiddleware } from './middleware/error.middleware'
import { verifyToken } from './middleware/auth.middleware'
import { requireAdmin } from './middleware/admin.middleware'
import { securityHeaders } from './middleware/security'
import { apiLimiter } from './middleware/rateLimit'
import * as deviceController from './controllers/device.controller'

const app = express()
app.disable('x-powered-by')
// Trust the first proxy hop so req.ip reflects the real client (rate limiting).
app.set('trust proxy', 1)

const allowedOrigins = [
  process.env.ADMIN_PANEL_URL || 'http://localhost:3001',
  process.env.PUBLIC_APP_URL || 'http://localhost:3002',
].filter(Boolean)

// Only the app's own ports are relevant; the host must be loopback or a
// private LAN address (this tool is designed for LAN use with a dynamic IP).
const APP_PORTS = new Set(['3001', '3002'])

function isPrivateHost(hostname: string): boolean {
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') return true
  // IPv4 private ranges: 10.x, 192.168.x, 172.16–172.31.x
  if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname)) return true
  if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(hostname)) return true
  const m = hostname.match(/^172\.(\d{1,3})\.\d{1,3}\.\d{1,3}$/)
  if (m) {
    const second = Number(m[1])
    if (second >= 16 && second <= 31) return true
  }
  return false
}

function isAllowedOrigin(origin: string): boolean {
  if (allowedOrigins.includes(origin)) return true
  try {
    const { hostname, port } = new URL(origin)
    return APP_PORTS.has(port) && isPrivateHost(hostname)
  } catch {
    return false
  }
}

app.use(securityHeaders)
app.use(cors({
  origin: (origin, callback) => {
    // Same-origin / server-to-server requests have no Origin header.
    if (!origin) return callback(null, true)
    callback(null, isAllowedOrigin(origin))
  },
  credentials: true,
}))
app.use(express.json({ limit: '1mb' }))
app.use(cookieParser())

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' })
})

// Public config (no auth)
app.get('/api/config', (_req, res) => {
  res.json({ publicBaseUrl: getServerIP() })
})

// Broad limiter across the API surface.
app.use('/api', apiLimiter)

// Public routes — no auth
app.use('/api/public', publicRoutes)
app.use('/api/setup', setupRoutes)

// Auth
app.use('/api/auth', authRoutes)

// Protected routes
app.use('/api/devices', deviceRoutes)
app.use('/api/categories', categoryRoutes)
app.use('/api/brands', brandRoutes)
app.use('/api/personnel', personnelRoutes)
app.use('/api/departments', departmentRoutes)
app.use('/api/assignments', assignmentRoutes)

// Dashboard stats
app.get('/api/dashboard/stats', verifyToken, requireAdmin, deviceController.getDashboardStats)

// Admin-only routes
app.use('/api/admin/users', userRoutes)
app.use('/api/admin/backup', backupRoutes)

app.use(errorMiddleware)

function getNetworkIP(): string | null {
  const interfaces = os.networkInterfaces()
  for (const name of Object.keys(interfaces)) {
    for (const iface of (interfaces[name] || [])) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address
      }
    }
  }
  return null
}

const PORT = config.port
app.listen(PORT, '0.0.0.0', () => {
  const ip = getNetworkIP()
  console.log('')
  console.log('  ▲ IMS Backend')
  console.log('')
  console.log(`  - Local:   http://localhost:${PORT}`)
  if (ip) console.log(`  - Network: http://${ip}:${PORT}`)
  console.log('')
})
