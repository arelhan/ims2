import { prisma } from '../lib/prisma'

export async function getAllPersonnel(search?: string) {
  return prisma.personnel.findMany({
    where: search
      ? {
          OR: [
            { name: { contains: search } },
            { email: { contains: search } },
            { department: { contains: search } },
          ],
        }
      : undefined,
    include: {
      _count: { select: { assignments: true } },
      assignments: {
        where: { isActive: true },
        include: { device: { select: { id: true, name: true, serialNumber: true } } },
      },
    },
    orderBy: { name: 'asc' },
  })
}

export async function getPersonnelById(id: string) {
  const p = await prisma.personnel.findUnique({
    where: { id },
    include: {
      assignments: {
        include: { device: { include: { category: true, brand: true } } },
        orderBy: { assignedAt: 'desc' },
      },
    },
  })
  if (!p) throw { status: 404, message: 'Personnel not found' }
  return p
}

export async function createPersonnel(data: {
  name: string
  email: string
  department: string
  phone?: string
}) {
  return prisma.personnel.create({ data })
}

export async function updatePersonnel(
  id: string,
  data: { name?: string; email?: string; department?: string; phone?: string }
) {
  return prisma.personnel.update({ where: { id }, data })
}

export async function deletePersonnel(id: string) {
  const active = await prisma.assignment.count({ where: { personnelId: id, isActive: true } })
  if (active > 0) {
    throw { status: 400, message: `Cannot delete: person has ${active} active device assignment(s). Return the devices first.` }
  }
  // Cascade in schema handles historical assignments
  return prisma.personnel.delete({ where: { id } })
}
