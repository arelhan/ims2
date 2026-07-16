import { Request, Response, NextFunction } from 'express'
import { prisma } from '../lib/prisma'

export async function getDeviceById(req: Request, res: Response, next: NextFunction) {
  try {
    // Public endpoint (reachable by anyone who scans the QR): expose only
    // non-sensitive device facts. Personnel names/departments are PII and
    // are intentionally NOT included here.
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
      },
    })

    if (!device) return res.status(404).json({ error: 'Device not found' })
    res.json(device)
  } catch (err) {
    next(err)
  }
}
