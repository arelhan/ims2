import { Response, NextFunction } from 'express'
import { AuthRequest } from '../middleware/auth.middleware'
import * as departmentService from '../services/department.service'

export async function getAll(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    res.json(await departmentService.getAllDepartments(req.query.search as string))
  } catch (err) {
    next(err)
  }
}

export async function create(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    res.status(201).json(await departmentService.createDepartment(req.body.name))
  } catch (err) {
    next(err)
  }
}

export async function update(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    res.json(await departmentService.updateDepartment(req.params.id, req.body.name))
  } catch (err) {
    next(err)
  }
}

export async function remove(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await departmentService.deleteDepartment(req.params.id)
    res.json({ success: true })
  } catch (err) {
    next(err)
  }
}
