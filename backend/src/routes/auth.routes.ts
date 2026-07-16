import { Router } from 'express'
import * as authController from '../controllers/auth.controller'
import { verifyToken } from '../middleware/auth.middleware'
import { authLimiter } from '../middleware/rateLimit'
import { validateBody } from '../lib/validate'
import { loginSchema, changePasswordSchema, forgotPasswordSchema, resetPasswordSchema } from '../lib/schemas'

const router = Router()

router.post('/login', authLimiter, validateBody(loginSchema), authController.login)
router.post('/logout', authController.logout)
router.get('/me', verifyToken, authController.me)
router.post('/change-password', verifyToken, validateBody(changePasswordSchema), authController.changePassword)
router.post('/forgot-password', authLimiter, validateBody(forgotPasswordSchema), authController.forgotPassword)
router.post('/reset-password', authLimiter, validateBody(resetPasswordSchema), authController.resetPassword)

export default router
