import { Router } from 'express'
import * as userController from '../controllers/user.controller'
import { verifyToken } from '../middleware/auth.middleware'
import { requireAdmin } from '../middleware/admin.middleware'

const router = Router()

router.use(verifyToken, requireAdmin)

router.get('/', userController.getAll)
router.post('/', userController.create)
router.patch('/:id', userController.update)
router.delete('/:id', userController.remove)

export default router
