import bcrypt from 'bcryptjs'
import { prisma } from '../lib/prisma'
import { signToken } from '../lib/jwt'

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) throw { status: 401, message: 'Invalid credentials' }

  const valid = await bcrypt.compare(password, user.passwordHash)
  if (!valid) throw { status: 401, message: 'Invalid credentials' }

  if (user.role !== 'ADMIN') {
    throw { status: 403, message: 'Access denied. Admin privileges required.' }
  }

  const token = signToken({ id: user.id, role: user.role })
  return { token, user: { id: user.id, name: user.name, email: user.email, role: user.role } }
}

export async function getMe(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  })
  if (!user) throw { status: 404, message: 'User not found' }
  return user
}
