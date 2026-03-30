import { Request, Response, NextFunction } from 'express'
import * as authService from '../services/auth.service'
import { AuthRequest } from '../middleware/auth.middleware'

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { username, password } = req.body
    const { token, user } = await authService.login(username, password)
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.COOKIE_SECURE === 'true',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })
    res.json({ user })
  } catch (err) {
    next(err)
  }
}

export async function logout(_req: Request, res: Response) {
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

export async function changePassword(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { currentPassword, newPassword } = req.body
    await authService.changePassword(req.user!.id, currentPassword, newPassword)
    res.json({ success: true })
  } catch (err) {
    next(err)
  }
}

export async function forgotPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const { username } = req.body
    const { resetCode } = await authService.forgotPassword(username)
    res.json({ resetCode })
  } catch (err) {
    next(err)
  }
}

export async function resetPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const { username, code, newPassword } = req.body
    await authService.resetPassword(username, code, newPassword)
    res.json({ success: true })
  } catch (err) {
    next(err)
  }
}
