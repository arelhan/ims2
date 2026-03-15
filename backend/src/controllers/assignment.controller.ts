import { Response, NextFunction } from 'express'
import { AuthRequest } from '../middleware/auth.middleware'
import * as assignmentService from '../services/assignment.service'

export async function getAll(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    res.json(await assignmentService.getAllAssignments({
      search: req.query.search as string,
      isActive: req.query.isActive as string,
    }))
  } catch (err) { next(err) }
}

export async function create(req: AuthRequest, res: Response, next: NextFunction) {
  try { res.status(201).json(await assignmentService.createAssignment(req.body)) } catch (err) { next(err) }
}

export async function returnDevice(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    res.json(await assignmentService.returnAssignment(req.params.id, req.body.notes))
  } catch (err) { next(err) }
}
