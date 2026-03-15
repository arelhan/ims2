import { Request, Response, NextFunction } from 'express'
import * as authService from '../services/auth.service'
import { AuthRequest } from '../middleware/auth.middleware'

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body
    const { token, user } = await authService.login(email, password)
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    })
    res.json({ user })
  } catch (err) {
    next(err)
  }
}

export async function logout(req: Request, res: Response) {
  res.clearCookie('token')
  res.json({ success: true })
}

export async function me(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const user = await authService.getMe(req.user!.id)
    res.json(user)
  } catch (err) {
    next(err)
  }
}
