import { prisma } from '../lib/prisma'
import { generateDeviceQR } from '../lib/qr'

export async function getAllDevices(filters: {
  search?: string
  categoryId?: string
  brandId?: string
  status?: string
}) {
  const where: any = {}
  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search } },
      { serialNumber: { contains: filters.search } },
    ]
  }
  if (filters.categoryId) where.categoryId = filters.categoryId
  if (filters.brandId) where.brandId = filters.brandId
  if (filters.status) where.status = filters.status

  return prisma.device.findMany({
    where,
    include: {
      category: { select: { id: true, name: true } },
      brand: { select: { id: true, name: true } },
      assignments: {
        where: { isActive: true },
        include: { personnel: { select: { id: true, name: true, department: true } } },
        take: 1,
      },
    },
    orderBy: { createdAt: 'desc' },
  })
}

export async function getDeviceById(id: string) {
  const device = await prisma.device.findUnique({
    where: { id },
    include: {
      category: { include: { customFields: { orderBy: { order: 'asc' } } } },
      brand: true,
      customValues: {
        include: { customField: true },
        orderBy: { customField: { order: 'asc' } },
      },
      assignments: {
        include: { personnel: true },
        orderBy: { assignedAt: 'desc' },
      },
    },
  })
  if (!device) throw { status: 404, message: 'Device not found' }

  const qrCodeUrl = await generateDeviceQR(device.id)
  return { ...device, qrCodeUrl }
}

export async function createDevice(data: {
  name: string
  serialNumber: string
  categoryId: string
  brandId?: string
  status?: string
  purchaseDate?: string
  notes?: string
  customValues?: { customFieldId: string; value: string }[]
}) {
  const { customValues, ...deviceData } = data
  const device = await prisma.device.create({
    data: {
      ...deviceData,
      purchaseDate: deviceData.purchaseDate ? new Date(deviceData.purchaseDate) : undefined,
      customValues: customValues
        ? { create: customValues }
        : undefined,
    },
  })

  const qrCodeUrl = await generateDeviceQR(device.id)
  return prisma.device.update({
    where: { id: device.id },
    data: { qrCodeUrl },
    include: {
      category: true,
      brand: true,
      customValues: { include: { customField: true } },
    },
  })
}

export async function updateDevice(
  id: string,
  data: {
    name?: string
    serialNumber?: string
    categoryId?: string
    brandId?: string | null
    status?: string
    purchaseDate?: string | null
    notes?: string
    customValues?: { customFieldId: string; value: string }[]
  }
) {
  const { customValues, ...deviceData } = data

  if (customValues) {
    // Upsert each custom value
    await Promise.all(
      customValues.map(cv =>
        prisma.customValue.upsert({
          where: { deviceId_customFieldId: { deviceId: id, customFieldId: cv.customFieldId } },
          create: { deviceId: id, customFieldId: cv.customFieldId, value: cv.value },
          update: { value: cv.value },
        })
      )
    )
  }

  return prisma.device.update({
    where: { id },
    data: {
      ...deviceData,
      purchaseDate: deviceData.purchaseDate
        ? new Date(deviceData.purchaseDate)
        : deviceData.purchaseDate === null
        ? null
        : undefined,
    },
    include: {
      category: true,
      brand: true,
      customValues: { include: { customField: true } },
    },
  })
}

export async function deleteDevice(id: string) {
  const device = await prisma.device.findUnique({ where: { id } })
  if (!device) throw { status: 404, message: 'Device not found' }
  if (device.status === 'ASSIGNED') {
    throw { status: 400, message: 'Cannot delete an assigned device. Return it first.' }
  }
  // onDelete: Cascade in schema handles assignment history and customValues
  return prisma.device.delete({ where: { id } })
}

export async function getDashboardStats() {
  const [totalDevices, byStatus, totalPersonnel, activeAssignments, recentDevices] = await Promise.all([
    prisma.device.count(),
    prisma.device.groupBy({ by: ['status'], _count: true }),
    prisma.personnel.count(),
    prisma.assignment.count({ where: { isActive: true } }),
    prisma.device.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { category: true, brand: true },
    }),
  ])

  const statusMap = byStatus.reduce((acc: any, cur) => {
    acc[cur.status] = cur._count
    return acc
  }, {})

  return {
    totalDevices,
    inWarehouse: statusMap['IN_WAREHOUSE'] || 0,
    assigned: statusMap['ASSIGNED'] || 0,
    maintenance: statusMap['MAINTENANCE'] || 0,
    retired: statusMap['RETIRED'] || 0,
    totalPersonnel,
    activeAssignments,
    recentDevices,
  }
}
