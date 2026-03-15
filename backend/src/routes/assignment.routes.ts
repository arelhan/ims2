import { Router } from 'express'
import * as assignmentController from '../controllers/assignment.controller'
import { verifyToken } from '../middleware/auth.middleware'
import { requireAdmin } from '../middleware/admin.middleware'

const router = Router()

router.use(verifyToken, requireAdmin)

router.get('/', assignmentController.getAll)
router.post('/', assignmentController.create)
router.patch('/:id/return', assignmentController.returnDevice)

export default router
