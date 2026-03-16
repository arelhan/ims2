import { Router } from 'express'
import * as departmentController from '../controllers/department.controller'
import { verifyToken } from '../middleware/auth.middleware'
import { requireAdmin } from '../middleware/admin.middleware'

const router = Router()

router.use(verifyToken, requireAdmin)

router.get('/', departmentController.getAll)
router.post('/', departmentController.create)
router.put('/:id', departmentController.update)
router.delete('/:id', departmentController.remove)

export default router
