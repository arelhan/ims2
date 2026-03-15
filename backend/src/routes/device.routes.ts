import { Router } from 'express'
import * as deviceController from '../controllers/device.controller'
import { verifyToken } from '../middleware/auth.middleware'
import { requireAdmin } from '../middleware/admin.middleware'

const router = Router()

router.use(verifyToken, requireAdmin)

router.get('/', deviceController.getAll)
router.get('/:id', deviceController.getById)
router.post('/', deviceController.create)
router.put('/:id', deviceController.update)
router.delete('/:id', deviceController.remove)

export default router
