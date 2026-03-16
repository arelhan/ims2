import bcrypt from 'bcryptjs'
import { prisma } from '../lib/prisma'

export async function getAllUsers() {
  return prisma.user.findMany({
    select: { id: true, name: true, username: true, role: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  })
}

export async function createUser(data: {
  name: string
  username: string
  password: string
  role?: string
}) {
  const passwordHash = await bcrypt.hash(data.password, 10)
  return prisma.user.create({
    data: { name: data.name, username: data.username, passwordHash, role: data.role || 'VIEWER' },
    select: { id: true, name: true, username: true, role: true, createdAt: true },
  })
}

export async function updateUser(
  id: string,
  data: { name?: string; username?: string; password?: string; role?: string }
) {
  const updateData: any = {}
  if (data.name) updateData.name = data.name
  if (data.username) updateData.username = data.username
  if (data.role) updateData.role = data.role
  if (data.password) updateData.passwordHash = await bcrypt.hash(data.password, 10)

  return prisma.user.update({
    where: { id },
    data: updateData,
    select: { id: true, name: true, username: true, role: true, createdAt: true },
  })
}

export async function deleteUser(id: string) {
  const user = await prisma.user.findUnique({ where: { id }, select: { role: true } })
  if (user?.role === 'ADMIN') {
    const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } })
    if (adminCount <= 1) {
      throw { status: 400, message: 'Cannot delete the last admin user' }
    }
  }
  return prisma.user.delete({ where: { id } })
}
