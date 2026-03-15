import { Router } from 'express'
import * as authController from '../controllers/auth.controller'
import { verifyToken } from '../middleware/auth.middleware'

const router = Router()

router.post('/login', authController.login)
router.post('/logout', authController.logout)
router.get('/me', verifyToken, authController.me)

export default router
