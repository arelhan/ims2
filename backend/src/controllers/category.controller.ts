import { Response, NextFunction } from 'express'
import { AuthRequest } from '../middleware/auth.middleware'
import * as categoryService from '../services/category.service'

export async function getAll(req: AuthRequest, res: Response, next: NextFunction) {
  try { res.json(await categoryService.getAllCategories()) } catch (err) { next(err) }
}

export async function create(req: AuthRequest, res: Response, next: NextFunction) {
  try { res.status(201).json(await categoryService.createCategory(req.body)) } catch (err) { next(err) }
}

export async function update(req: AuthRequest, res: Response, next: NextFunction) {
  try { res.json(await categoryService.updateCategory(req.params.id, req.body)) } catch (err) { next(err) }
}

export async function remove(req: AuthRequest, res: Response, next: NextFunction) {
  try { await categoryService.deleteCategory(req.params.id); res.json({ success: true }) } catch (err) { next(err) }
}

export async function getFields(req: AuthRequest, res: Response, next: NextFunction) {
  try { res.json(await categoryService.getFields(req.params.id)) } catch (err) { next(err) }
}

export async function createField(req: AuthRequest, res: Response, next: NextFunction) {
  try { res.status(201).json(await categoryService.createField(req.params.id, req.body)) } catch (err) { next(err) }
}

export async function updateField(req: AuthRequest, res: Response, next: NextFunction) {
  try { res.json(await categoryService.updateField(req.params.id, req.params.fid, req.body)) } catch (err) { next(err) }
}

export async function deleteField(req: AuthRequest, res: Response, next: NextFunction) {
  try { await categoryService.deleteField(req.params.id, req.params.fid); res.json({ success: true }) } catch (err) { next(err) }
}

export async function reorderFields(req: AuthRequest, res: Response, next: NextFunction) {
  try { res.json(await categoryService.reorderFields(req.params.id, req.body.orderedIds)) } catch (err) { next(err) }
}
