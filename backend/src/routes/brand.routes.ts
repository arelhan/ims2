import { Router } from 'express'
import * as brandController from '../controllers/brand.controller'
import { verifyToken } from '../middleware/auth.middleware'
import { requireAdmin } from '../middleware/admin.middleware'

const router = Router()

router.use(verifyToken, requireAdmin)

router.get('/', brandController.getAll)
router.post('/', brandController.create)
router.put('/:id', brandController.update)
router.delete('/:id', brandController.remove)

export default router
