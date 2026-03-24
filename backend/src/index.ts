import 'dotenv/config'
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
import { errorMiddleware } from './middleware/error.middleware'
import { verifyToken } from './middleware/auth.middleware'
import { requireAdmin } from './middleware/admin.middleware'
import * as deviceController from './controllers/device.controller'

const app = express()

const allowedOrigins = [
  process.env.ADMIN_PANEL_URL || 'http://localhost:3001',
  process.env.PUBLIC_APP_URL || 'http://localhost:3002',
]

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true)
    try {
      const { port } = new URL(origin)
      if (port === '3001' || port === '3002') return callback(null, true)
      if (allowedOrigins.includes(origin)) return callback(null, true)
    } catch {}
    callback(null, false)
  },
  credentials: true,
}))
app.use(express.json())
app.use(cookieParser())

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' })
})

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

const PORT = Number(process.env.PORT) || 4000
app.listen(PORT, '0.0.0.0', () => {
  const ip = getNetworkIP()
  console.log('')
  console.log('  ▲ IMS Backend')
  console.log('')
  console.log(`  - Local:   http://localhost:${PORT}`)
  if (ip) console.log(`  - Network: http://${ip}:${PORT}`)
  console.log('')
})
