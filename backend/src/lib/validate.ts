import { Request, Response, NextFunction } from 'express'
import { ZodSchema, ZodError } from 'zod'

// Validation middleware factory. Parses and replaces req.body with the
// typed/validated result so downstream handlers get clean, trusted input.
export function validateBody(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    // A body-less request (e.g. PATCH with no payload) leaves req.body undefined;
    // treat it as an empty object so all-optional schemas still validate.
    const result = schema.safeParse(req.body ?? {})
    if (!result.success) {
      const details = formatZodError(result.error)
      return res.status(400).json({ error: details || 'Validation failed', details })
    }
    req.body = result.data
    next()
  }
}

export function formatZodError(error: ZodError): string {
  return error.issues
    .map(issue => {
      const path = issue.path.join('.')
      return path ? `${path}: ${issue.message}` : issue.message
    })
    .join('; ')
}
