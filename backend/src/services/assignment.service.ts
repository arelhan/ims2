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
  const personnel = await prisma.personnel.findUnique({ where: { id: data.personnelId } })
  if (!personnel) throw { status: 404, message: 'Personnel not found' }

  // Re-check device status and flip it inside one transaction so two
  // concurrent requests can't both assign the same device.
  return prisma.$transaction(async tx => {
    const device = await tx.device.findUnique({ where: { id: data.deviceId } })
    if (!device) throw { status: 404, message: 'Device not found' }
    if (device.status === 'ASSIGNED') throw { status: 400, message: 'Device is already assigned' }
    if (device.status !== 'IN_WAREHOUSE') {
      throw { status: 400, message: 'Only devices in the warehouse can be assigned' }
    }

    const assignment = await tx.assignment.create({
      data: {
        deviceId: data.deviceId,
        personnelId: data.personnelId,
        notes: data.notes,
        isActive: true,
      },
      include: { device: true, personnel: true },
    })

    await tx.device.update({
      where: { id: data.deviceId },
      data: { status: 'ASSIGNED' },
    })

    return assignment
  })
}

export async function returnAssignment(id: string, notes?: string) {
  return prisma.$transaction(async tx => {
    const assignment = await tx.assignment.findUnique({ where: { id } })
    if (!assignment) throw { status: 404, message: 'Assignment not found' }
    if (!assignment.isActive) throw { status: 400, message: 'Assignment already returned' }

    const updated = await tx.assignment.update({
      where: { id },
      data: { isActive: false, returnedAt: new Date(), notes: notes || assignment.notes },
      include: { device: true, personnel: true },
    })

    // Only move the device back to warehouse if it is still marked ASSIGNED
    // (it may have been changed to MAINTENANCE/RETIRED in the meantime).
    await tx.device.updateMany({
      where: { id: assignment.deviceId, status: 'ASSIGNED' },
      data: { status: 'IN_WAREHOUSE' },
    })

    return updated
  })
}
