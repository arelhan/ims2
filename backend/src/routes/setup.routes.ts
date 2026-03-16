import { Router, Request, Response, NextFunction } from 'express'
import { prisma } from '../lib/prisma'
import bcrypt from 'bcryptjs'

const router = Router()

// GET /api/setup/status — public, no auth
router.get('/status', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const count = await prisma.user.count()
    res.json({ needsSetup: count === 0 })
  } catch (err) {
    next(err)
  }
})

// POST /api/setup — create first admin, only allowed when no users exist
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const count = await prisma.user.count()
    if (count > 0) {
      return res.status(403).json({ error: 'Setup already completed' })
    }

    const { name, username, password } = req.body
    if (!name || !username || !password) {
      return res.status(400).json({ error: 'Name, username and password are required' })
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' })
    }

    const passwordHash = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({
      data: { name, username, passwordHash, role: 'ADMIN' },
    })

    res.status(201).json({ id: user.id, name: user.name, username: user.username })
  } catch (err: any) {
    if (err.code === 'P2002') {
      return res.status(400).json({ error: 'Username already in use' })
    }
    next(err)
  }
})

export default router
