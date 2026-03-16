import { Response, NextFunction } from 'express'
import { AuthRequest } from '../middleware/auth.middleware'
import * as personnelService from '../services/personnel.service'

export async function getAll(req: AuthRequest, res: Response, next: NextFunction) {
  try { res.json(await personnelService.getAllPersonnel(req.query.search as string)) } catch (err) { next(err) }
}

export async function getById(req: AuthRequest, res: Response, next: NextFunction) {
  try { res.json(await personnelService.getPersonnelById(req.params.id)) } catch (err) { next(err) }
}

export async function create(req: AuthRequest, res: Response, next: NextFunction) {
  try { res.status(201).json(await personnelService.createPersonnel(req.body)) } catch (err) { next(err) }
}

export async function update(req: AuthRequest, res: Response, next: NextFunction) {
  try { res.json(await personnelService.updatePersonnel(req.params.id, req.body)) } catch (err) { next(err) }
}

export async function remove(req: AuthRequest, res: Response, next: NextFunction) {
  try { await personnelService.deletePersonnel(req.params.id); res.json({ success: true }) } catch (err) { next(err) }
}

export async function downloadTemplate(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const csv = personnelService.getPersonnelImportTemplateCsv()
    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', 'attachment; filename="personnel-template.csv"')
    res.send(csv)
  } catch (err) {
    next(err)
  }
}

export async function bulkImport(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.file) return res.status(400).json({ error: 'CSV file is required' })
    const result = await personnelService.importPersonnelFromCsv(req.file.buffer)
    res.json(result)
  } catch (err) {
    next(err)
  }
}
