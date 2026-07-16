import { Router } from 'express'
import * as assignmentController from '../controllers/assignment.controller'
import { verifyToken } from '../middleware/auth.middleware'
import { requireAdmin } from '../middleware/admin.middleware'
import { validateBody } from '../lib/validate'
import { createAssignmentSchema, returnAssignmentSchema } from '../lib/schemas'

const router = Router()

router.use(verifyToken, requireAdmin)

router.get('/', assignmentController.getAll)
router.post('/', validateBody(createAssignmentSchema), assignmentController.create)
router.patch('/:id/return', validateBody(returnAssignmentSchema), assignmentController.returnDevice)

export default router
