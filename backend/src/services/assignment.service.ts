import { prisma } from '../lib/prisma'

export async function getAllAssignments(filters: { search?: string; isActive?: string }) {
  const where: any = {}
  if (filters.isActive !== undefined) {
    where.isActive = filters.isActive === 'true'
  }
  if (filters.search) {
    where.OR = [
      { device: { name: { contains: filters.search } } },
      { personnel: { name: { contains: filters.search } } },
      { personnel: { department: { name: { contains: filters.search } } } },
      { device: { serialNumber: { contains: filters.search } } },
    ]
  }
  return prisma.assignment.findMany({
    where,
    include: {
      device: { select: { id: true, name: true, serialNumber: true, category: true } },
      personnel: {
        select: {
          id: true,
          name: true,
          email: true,
          department: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: { assignedAt: 'desc' },
  })
}

export async function createAssignment(data: {
  deviceId: string
  personnelId: string
  notes?: string
}) {
  const device = await prisma.device.findUnique({ where: { id: data.deviceId } })
  if (!device) throw { status: 404, message: 'Device not found' }
  if (device.status === 'ASSIGNED') throw { status: 400, message: 'Device is already assigned' }
  if (device.status === 'RETIRED') throw { status: 400, message: 'Cannot assign a retired device' }

  const personnel = await prisma.personnel.findUnique({ where: { id: data.personnelId } })
  if (!personnel) throw { status: 404, message: 'Personnel not found' }

  const assignment = await prisma.assignment.create({
    data: { ...data, isActive: true },
    include: { device: true, personnel: true },
  })

  await prisma.device.update({
    where: { id: data.deviceId },
    data: { status: 'ASSIGNED' },
  })

  return assignment
}

export async function returnAssignment(id: string, notes?: string) {
  const assignment = await prisma.assignment.findUnique({ where: { id } })
  if (!assignment) throw { status: 404, message: 'Assignment not found' }
  if (!assignment.isActive) throw { status: 400, message: 'Assignment already returned' }

  const updated = await prisma.assignment.update({
    where: { id },
    data: { isActive: false, returnedAt: new Date(), notes: notes || assignment.notes },
    include: { device: true, personnel: true },
  })

  await prisma.device.update({
    where: { id: assignment.deviceId },
    data: { status: 'IN_WAREHOUSE' },
  })

  return updated
}
