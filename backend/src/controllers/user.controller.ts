import { Response, NextFunction } from 'express'
import { AuthRequest } from '../middleware/auth.middleware'
import * as userService from '../services/user.service'

export async function getAll(req: AuthRequest, res: Response, next: NextFunction) {
  try { res.json(await userService.getAllUsers()) } catch (err) { next(err) }
}

export async function create(req: AuthRequest, res: Response, next: NextFunction) {
  try { res.status(201).json(await userService.createUser(req.body)) } catch (err) { next(err) }
}

export async function update(req: AuthRequest, res: Response, next: NextFunction) {
  try { res.json(await userService.updateUser(req.params.id, req.body)) } catch (err) { next(err) }
}

export async function remove(req: AuthRequest, res: Response, next: NextFunction) {
  try { await userService.deleteUser(req.params.id); res.json({ success: true }) } catch (err) { next(err) }
}
