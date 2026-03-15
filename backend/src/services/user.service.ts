import bcrypt from 'bcryptjs'
import { prisma } from '../lib/prisma'

export async function getAllUsers() {
  return prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  })
}

export async function createUser(data: {
  name: string
  email: string
  password: string
  role?: string
}) {
  const passwordHash = await bcrypt.hash(data.password, 10)
  return prisma.user.create({
    data: { name: data.name, email: data.email, passwordHash, role: data.role || 'VIEWER' },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  })
}

export async function updateUser(
  id: string,
  data: { name?: string; email?: string; password?: string; role?: string }
) {
  const updateData: any = {}
  if (data.name) updateData.name = data.name
  if (data.email) updateData.email = data.email
  if (data.role) updateData.role = data.role
  if (data.password) updateData.passwordHash = await bcrypt.hash(data.password, 10)

  return prisma.user.update({
    where: { id },
    data: updateData,
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  })
}

export async function deleteUser(id: string) {
  return prisma.user.delete({ where: { id } })
}
