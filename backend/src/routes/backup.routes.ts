import { Router } from 'express'
import multer from 'multer'
import * as backupController from '../controllers/backup.controller'
import { verifyToken } from '../middleware/auth.middleware'
import { requireAdmin } from '../middleware/admin.middleware'

const router = Router()
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 100 * 1024 * 1024 } })

router.use(verifyToken, requireAdmin)

router.get('/download', backupController.download)
router.post('/restore', upload.single('file'), backupController.restore)

export default router
