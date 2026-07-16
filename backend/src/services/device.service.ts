import { Prisma } from '@prisma/client'
import { prisma } from '../lib/prisma'
import { generateDeviceQR } from '../lib/qr'

type CustomValueInput = { customFieldId: string; value: string }

async function validateCustomValues(
  db: Prisma.TransactionClient | typeof prisma,
  categoryId: string,
  submitted: CustomValueInput[],
  existingValues: CustomValueInput[] = []
) {
  const fields = await db.customField.findMany({ where: { categoryId } })
  const fieldIds = new Set(fields.map(field => field.id))
  const submittedIds = new Set<string>()

  for (const item of submitted) {
    if (submittedIds.has(item.customFieldId)) {
      throw { status: 400, message: 'The same custom field cannot be submitted more than once' }
    }
    submittedIds.add(item.customFieldId)
    if (!fieldIds.has(item.customFieldId)) {
      throw { status: 400, message: 'A custom field does not belong to the selected category' }
    }
  }

  const effectiveValues = new Map(existingValues.map(item => [item.customFieldId, item.value]))
  submitted.forEach(item => effectiveValues.set(item.customFieldId, item.value))

  for (const field of fields) {
    const value = effectiveValues.get(field.id)?.trim() || ''
    if (field.isRequired && !value) {
      throw { status: 400, message: `${field.label} is required` }
    }
    if (!value) continue

    const invalid =
      (field.fieldType === 'NUMBER' && !Number.isFinite(Number(value))) ||
      (field.fieldType === 'DATE' && Number.isNaN(Date.parse(value))) ||
      (field.fieldType === 'BOOLEAN' && !['true', 'false'].includes(value)) ||
      (field.fieldType === 'EMAIL' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) ||
      (field.fieldType === 'URL' && !URL.canParse(value)) ||
      (field.fieldType === 'SELECT' && !field.placeholder
        ?.split(',')
        .map(option => option.trim())
        .filter(Boolean)
        .includes(value))

    if (invalid) {
      throw { status: 400, message: `${field.label} has an invalid value` }
    }
  }
}

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
      { category: { name: { contains: filters.search } } },
      { brand: { name: { contains: filters.search } } },
      {
        assignments: {
          some: {
            isActive: true,
            OR: [
              { personnel: { name: { contains: filters.search } } },
              { personnel: { email: { contains: filters.search } } },
              { personnel: { department: { name: { contains: filters.search } } } },
            ],
          },
        },
      },
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
        include: {
          personnel: {
            select: {
              id: true,
              name: true,
              email: true,
              department: { select: { id: true, name: true } },
            },
          },
        },
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
        include: { personnel: { include: { department: { select: { id: true, name: true } } } } },
        orderBy: { assignedAt: 'desc' },
      },
    },
  })
  if (!device) throw { status: 404, message: 'Device not found' }

  // When PUBLIC_APP_URL is configured the QR target is stable, so reuse the
  // stored image. In auto-IP mode the address can change between runs, so
  // regenerate to keep the QR pointing at the current host.
  const stableBaseUrl = !!process.env.PUBLIC_APP_URL
  let qrCodeUrl = device.qrCodeUrl
  if (!qrCodeUrl || !stableBaseUrl) {
    qrCodeUrl = await generateDeviceQR(device.id)
    if (qrCodeUrl !== device.qrCodeUrl) {
      await prisma.device.update({ where: { id: device.id }, data: { qrCodeUrl } })
    }
  }
  return { ...device, qrCodeUrl }
}

export async function createDevice(data: {
  name: string
  serialNumber: string
  categoryId: string
  brandId?: string | null
  status?: string
  purchaseDate?: string | null
  notes?: string
  customValues?: CustomValueInput[]
  assignedToPersonnelId?: string
}) {
  const customValues = data.customValues || []
  const device = await prisma.$transaction(async tx => {
    await validateCustomValues(tx, data.categoryId, customValues)

    if (data.status === 'ASSIGNED') {
      const personnelId = data.assignedToPersonnelId
      if (!personnelId) throw { status: 400, message: 'Personnel is required' }
      const personnel = await tx.personnel.findUnique({ where: { id: personnelId } })
      if (!personnel) throw { status: 400, message: 'Invalid personnel selected' }
    }

    const created = await tx.device.create({
      data: {
        name: data.name,
        serialNumber: data.serialNumber,
        categoryId: data.categoryId,
        brandId: data.brandId || undefined,
        status: data.status,
        purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : undefined,
        notes: data.notes,
        customValues: customValues.length ? {
          create: customValues
            .filter(item => item.value !== '')
            .map(({ customFieldId, value }) => ({ customFieldId, value })),
        } : undefined,
      },
    })

    if (data.status === 'ASSIGNED' && data.assignedToPersonnelId) {
      await tx.assignment.create({
        data: { deviceId: created.id, personnelId: data.assignedToPersonnelId, isActive: true },
      })
    }

    return created
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
    customValues?: CustomValueInput[]
  }
) {
  const existing = await prisma.device.findUnique({
    where: { id },
    include: {
      assignments: { where: { isActive: true }, take: 1 },
      customValues: { select: { customFieldId: true, value: true } },
    },
  })
  if (!existing) throw { status: 404, message: 'Device not found' }

  const activeAssignment = existing.assignments[0] || null

  // Guard status transitions so device.status and assignments stay consistent.
  if (data.status === 'ASSIGNED' && !activeAssignment) {
    throw { status: 400, message: 'To mark a device as Assigned, assign it to a person from the device page.' }
  }

  // Whitelist scalar fields.
  const deviceData: any = {}
  if (data.name !== undefined) deviceData.name = data.name
  if (data.serialNumber !== undefined) deviceData.serialNumber = data.serialNumber
  if (data.categoryId !== undefined) deviceData.categoryId = data.categoryId
  if (data.brandId !== undefined) deviceData.brandId = data.brandId
  if (data.status !== undefined) deviceData.status = data.status
  if (data.notes !== undefined) deviceData.notes = data.notes
  if (data.purchaseDate !== undefined) {
    deviceData.purchaseDate = data.purchaseDate ? new Date(data.purchaseDate) : null
  }

  const categoryChanged = data.categoryId !== undefined && data.categoryId !== existing.categoryId

  return prisma.$transaction(async tx => {
    if (data.customValues || categoryChanged) {
      await validateCustomValues(
        tx,
        data.categoryId || existing.categoryId,
        data.customValues || [],
        categoryChanged ? [] : existing.customValues
      )
    }

    // If the category changed, drop custom values that belong to the old
    // category so stale specifications don't linger on the device.
    if (categoryChanged) {
      await tx.customValue.deleteMany({
        where: { deviceId: id, customField: { categoryId: existing.categoryId } },
      })
    }

    if (data.customValues) {
      for (const cv of data.customValues) {
        if (cv.value === '') {
          await tx.customValue.deleteMany({
            where: { deviceId: id, customFieldId: cv.customFieldId },
          })
          continue
        }
        await tx.customValue.upsert({
          where: { deviceId_customFieldId: { deviceId: id, customFieldId: cv.customFieldId } },
          create: { deviceId: id, customFieldId: cv.customFieldId, value: cv.value },
          update: { value: cv.value },
        })
      }
    }

    // Moving a device out of ASSIGNED while it still has an active
    // assignment auto-returns that assignment to keep state consistent.
    if (activeAssignment && data.status !== undefined && data.status !== 'ASSIGNED') {
      await tx.assignment.update({
        where: { id: activeAssignment.id },
        data: { isActive: false, returnedAt: new Date() },
      })
    }

    return tx.device.update({
      where: { id },
      data: deviceData,
      include: {
        category: true,
        brand: true,
        customValues: { include: { customField: true } },
      },
    })
  })
}

export async function deleteDevice(id: string) {
  const device = await prisma.device.findUnique({
    where: { id },
    include: { assignments: { where: { isActive: true }, select: { id: true }, take: 1 } },
  })
  if (!device) throw { status: 404, message: 'Device not found' }
  if (device.assignments.length > 0) {
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
