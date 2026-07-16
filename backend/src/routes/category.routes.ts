import { Router } from 'express'
import * as categoryController from '../controllers/category.controller'
import { verifyToken } from '../middleware/auth.middleware'
import { requireAdmin } from '../middleware/admin.middleware'
import { validateBody } from '../lib/validate'
import { createCategorySchema, updateCategorySchema, createFieldSchema, updateFieldSchema, reorderFieldsSchema } from '../lib/schemas'

const router = Router()

router.use(verifyToken, requireAdmin)

router.get('/', categoryController.getAll)
router.post('/', validateBody(createCategorySchema), categoryController.create)
router.put('/:id', validateBody(updateCategorySchema), categoryController.update)
router.delete('/:id', categoryController.remove)

// Custom fields
router.get('/:id/fields', categoryController.getFields)
router.post('/:id/fields', validateBody(createFieldSchema), categoryController.createField)
router.put('/:id/fields/:fid', validateBody(updateFieldSchema), categoryController.updateField)
router.delete('/:id/fields/:fid', categoryController.deleteField)
router.patch('/:id/fields/reorder', validateBody(reorderFieldsSchema), categoryController.reorderFields)

export default router
