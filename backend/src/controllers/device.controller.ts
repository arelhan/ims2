import { Response, NextFunction } from 'express'
import { AuthRequest } from '../middleware/auth.middleware'
import * as deviceService from '../services/device.service'

export async function getAll(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { search, categoryId, brandId, status } = req.query
    const devices = await deviceService.getAllDevices({
      search: search as string,
      categoryId: categoryId as string,
      brandId: brandId as string,
      status: status as string,
    })
    res.json(devices)
  } catch (err) { next(err) }
}

export async function getById(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const device = await deviceService.getDeviceById(req.params.id)
    res.json(device)
  } catch (err) { next(err) }
}

export async function create(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const device = await deviceService.createDevice(req.body)
    res.status(201).json(device)
  } catch (err) { next(err) }
}

export async function update(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const device = await deviceService.updateDevice(req.params.id, req.body)
    res.json(device)
  } catch (err) { next(err) }
}

export async function remove(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await deviceService.deleteDevice(req.params.id)
    res.json({ success: true })
  } catch (err) { next(err) }
}

export async function getDashboardStats(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const stats = await deviceService.getDashboardStats()
    res.json(stats)
  } catch (err) { next(err) }
}
