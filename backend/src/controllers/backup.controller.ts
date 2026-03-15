import { Response, NextFunction } from 'express'
import { AuthRequest } from '../middleware/auth.middleware'
import * as backupService from '../services/backup.service'

export async function download(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const buffer = backupService.downloadBackup()
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    res.setHeader('Content-Type', 'application/octet-stream')
    res.setHeader('Content-Disposition', `attachment; filename="backup-${timestamp}.db"`)
    res.send(buffer)
  } catch (err) { next(err) }
}

export async function restore(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' })
    backupService.restoreBackup(req.file.buffer)
    res.json({ success: true, message: 'Database restored successfully' })
  } catch (err) { next(err) }
}
