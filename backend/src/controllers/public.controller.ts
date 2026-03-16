import { Request, Response, NextFunction } from 'express'
import { prisma } from '../lib/prisma'

export async function getDeviceById(req: Request, res: Response, next: NextFunction) {
  try {
    const device = await prisma.device.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        name: true,
        serialNumber: true,
        status: true,
        qrCodeUrl: true,
        category: { select: { name: true } },
        brand: { select: { name: true } },
        customValues: {
          select: {
            value: true,
            customField: { select: { label: true, order: true, fieldType: true } },
          },
          orderBy: { customField: { order: 'asc' } },
        },
        assignments: {
          where: { isActive: true },
          select: {
            assignedAt: true,
            personnel: {
              select: {
                name: true,
                department: { select: { name: true } },
              },
            },
          },
          take: 1,
        },
      },
    })

    if (!device) return res.status(404).json({ error: 'Device not found' })
    res.json(device)
  } catch (err) {
    next(err)
  }
}
