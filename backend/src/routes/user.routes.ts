import { Router } from 'express'
import * as userController from '../controllers/user.controller'
import { verifyToken } from '../middleware/auth.middleware'
import { requireAdmin } from '../middleware/admin.middleware'
import { validateBody } from '../lib/validate'
import { createUserSchema, updateUserSchema } from '../lib/schemas'

const router = Router()

router.use(verifyToken, requireAdmin)

router.get('/', userController.getAll)
router.post('/', validateBody(createUserSchema), userController.create)
router.patch('/:id', validateBody(updateUserSchema), userController.update)
router.delete('/:id', userController.remove)

export default router
