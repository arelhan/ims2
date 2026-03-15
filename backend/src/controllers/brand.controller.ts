import { Response, NextFunction } from 'express'
import { AuthRequest } from '../middleware/auth.middleware'
import * as brandService from '../services/brand.service'

export async function getAll(req: AuthRequest, res: Response, next: NextFunction) {
  try { res.json(await brandService.getAllBrands()) } catch (err) { next(err) }
}

export async function create(req: AuthRequest, res: Response, next: NextFunction) {
  try { res.status(201).json(await brandService.createBrand(req.body)) } catch (err) { next(err) }
}

export async function update(req: AuthRequest, res: Response, next: NextFunction) {
  try { res.json(await brandService.updateBrand(req.params.id, req.body)) } catch (err) { next(err) }
}

export async function remove(req: AuthRequest, res: Response, next: NextFunction) {
  try { await brandService.deleteBrand(req.params.id); res.json({ success: true }) } catch (err) { next(err) }
}
