import { Router } from 'express'
import multer from 'multer'
import * as personnelController from '../controllers/personnel.controller'
import { verifyToken } from '../middleware/auth.middleware'
import { requireAdmin } from '../middleware/admin.middleware'
import { validateBody } from '../lib/validate'
import { createPersonnelSchema, updatePersonnelSchema } from '../lib/schemas'

const router = Router()
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 2 * 1024 * 1024 } })

router.use(verifyToken, requireAdmin)

router.get('/template', personnelController.downloadTemplate)
router.post('/bulk-import', upload.single('file'), personnelController.bulkImport)
router.get('/', personnelController.getAll)
router.get('/:id', personnelController.getById)
router.post('/', validateBody(createPersonnelSchema), personnelController.create)
router.put('/:id', validateBody(updatePersonnelSchema), personnelController.update)
router.delete('/:id', personnelController.remove)

export default router
