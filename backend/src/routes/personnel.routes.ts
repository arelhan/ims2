import { Router } from 'express'
import * as personnelController from '../controllers/personnel.controller'
import { verifyToken } from '../middleware/auth.middleware'
import { requireAdmin } from '../middleware/admin.middleware'

const router = Router()

router.use(verifyToken, requireAdmin)

router.get('/', personnelController.getAll)
router.get('/:id', personnelController.getById)
router.post('/', personnelController.create)
router.put('/:id', personnelController.update)
router.delete('/:id', personnelController.remove)

export default router
