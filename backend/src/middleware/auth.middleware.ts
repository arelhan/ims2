import jwt from 'jsonwebtoken'
import { Request, Response, NextFunction } from 'express'

export interface AuthRequest extends Request {
  user?: { id: string; role: 'ADMIN' }
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
