import { Router } from 'express'
import * as publicController from '../controllers/public.controller'

const router = Router()

router.get('/devices/:id', publicController.getDeviceById)

export default router
