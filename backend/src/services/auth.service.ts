import bcrypt from 'bcryptjs'
import { prisma } from '../lib/prisma'
import { signToken } from '../lib/jwt'

export async function login(username: string, password: string) {
  const user = await prisma.user.findUnique({ where: { username } })
  if (!user) throw { status: 401, message: 'Invalid credentials' }

  const valid = await bcrypt.compare(password, user.passwordHash)
  if (!valid) throw { status: 401, message: 'Invalid credentials' }

  if (user.role !== 'ADMIN') {
    throw { status: 403, message: 'Access denied. Admin privileges required.' }
  }

  const token = signToken({ id: user.id, role: user.role })
  return { token, user: { id: user.id, name: user.name, username: user.username, role: user.role } }
}

export async function getMe(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, username: true, role: true, createdAt: true },
  })
  if (!user) throw { status: 404, message: 'User not found' }
  return user
}

export async function changePassword(userId: string, currentPassword: string, newPassword: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) throw { status: 404, message: 'User not found' }

  const valid = await bcrypt.compare(currentPassword, user.passwordHash)
  if (!valid) throw { status: 400, message: 'Current password is incorrect' }

  if (newPassword.length < 6) throw { status: 400, message: 'Password must be at least 6 characters' }

  const passwordHash = await bcrypt.hash(newPassword, 10)
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } })
}

export async function forgotPassword(username: string) {
  const user = await prisma.user.findUnique({ where: { username } })
  if (!user) throw { status: 404, message: 'User not found' }

  // Generate a guaranteed 6-char alphanumeric code
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  const resetCode = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  const resetCodeExpiry = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes

  await prisma.user.update({
    where: { id: user.id },
    data: { resetCode, resetCodeExpiry },
  })

  return { resetCode }
}

export async function resetPassword(username: string, code: string, newPassword: string) {
  const user = await prisma.user.findUnique({ where: { username } })
  // Same error for missing code and wrong code — avoids leaking whether a reset was requested
  if (!user || !user.resetCode || !user.resetCodeExpiry || user.resetCode !== code.toUpperCase()) {
    throw { status: 400, message: 'Invalid or expired reset code' }
  }

  if (new Date() > user.resetCodeExpiry) {
    throw { status: 400, message: 'Reset code has expired. Request a new one.' }
  }

  if (newPassword.length < 6) throw { status: 400, message: 'Password must be at least 6 characters' }

  const passwordHash = await bcrypt.hash(newPassword, 10)
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash, resetCode: null, resetCodeExpiry: null },
  })
}
