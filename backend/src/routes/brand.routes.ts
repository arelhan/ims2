import { Router } from 'express'
import * as brandController from '../controllers/brand.controller'
import { verifyToken } from '../middleware/auth.middleware'
import { requireAdmin } from '../middleware/admin.middleware'
import { validateBody } from '../lib/validate'
import { brandSchema } from '../lib/schemas'

const router = Router()

router.use(verifyToken, requireAdmin)

router.get('/', brandController.getAll)
router.post('/', validateBody(brandSchema), brandController.create)
router.put('/:id', validateBody(brandSchema), brandController.update)
router.delete('/:id', brandController.remove)

export default router
