import { Router } from 'express'
import * as categoryController from '../controllers/category.controller'
import { verifyToken } from '../middleware/auth.middleware'
import { requireAdmin } from '../middleware/admin.middleware'

const router = Router()

router.use(verifyToken, requireAdmin)

router.get('/', categoryController.getAll)
router.post('/', categoryController.create)
router.put('/:id', categoryController.update)
router.delete('/:id', categoryController.remove)

// Custom fields
router.get('/:id/fields', categoryController.getFields)
router.post('/:id/fields', categoryController.createField)
router.put('/:id/fields/:fid', categoryController.updateField)
router.delete('/:id/fields/:fid', categoryController.deleteField)
router.patch('/:id/fields/reorder', categoryController.reorderFields)

export default router
