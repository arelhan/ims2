import { prisma } from '../lib/prisma'

export async function getAllDepartments(search?: string) {
  return prisma.department.findMany({
    where: search
      ? {
          name: { contains: search },
        }
      : undefined,
    include: {
      _count: { select: { personnel: true } },
    },
    orderBy: { name: 'asc' },
  })
}

export async function createDepartment(name: string) {
  const trimmedName = name.trim().replace(/\s+/g, ' ')
  if (!trimmedName) throw { status: 400, message: 'Department name is required' }

  return prisma.department.create({ data: { name: trimmedName } })
}

export async function updateDepartment(id: string, name: string) {
  const trimmedName = name.trim().replace(/\s+/g, ' ')
  if (!trimmedName) throw { status: 400, message: 'Department name is required' }

  return prisma.department.update({
    where: { id },
    data: { name: trimmedName },
  })
}

export async function deleteDepartment(id: string) {
  const linkedPersonnel = await prisma.personnel.count({ where: { departmentId: id } })
  if (linkedPersonnel > 0) {
    throw { status: 400, message: `Cannot delete: ${linkedPersonnel} personnel record(s) still use this department.` }
  }

  return prisma.department.delete({ where: { id } })
}
