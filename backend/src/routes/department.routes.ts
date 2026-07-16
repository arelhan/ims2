import { Router } from 'express'
import * as departmentController from '../controllers/department.controller'
import { verifyToken } from '../middleware/auth.middleware'
import { requireAdmin } from '../middleware/admin.middleware'
import { validateBody } from '../lib/validate'
import { departmentSchema } from '../lib/schemas'

const router = Router()

router.use(verifyToken, requireAdmin)

router.get('/', departmentController.getAll)
router.post('/', validateBody(departmentSchema), departmentController.create)
router.put('/:id', validateBody(departmentSchema), departmentController.update)
router.delete('/:id', departmentController.remove)

export default router
