import { Request, Response, NextFunction } from 'express'

// Maps a Prisma unique-constraint target to a friendly message.
function uniqueMessage(target: unknown): string {
  const fields = Array.isArray(target) ? target.join(', ') : String(target ?? '')
  if (/serialNumber/i.test(fields)) return 'A device with this serial number already exists'
  if (/email/i.test(fields)) return 'This email address is already in use'
  if (/username/i.test(fields)) return 'This username is already taken'
  if (/name/i.test(fields)) return 'A record with this name already exists'
  return 'This value already exists'
}

export function errorMiddleware(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  // Known "thrown object" errors from services: { status, message }
  if (err && typeof err.status === 'number' && err.message) {
    return res.status(err.status).json({ error: err.message })
  }

  // Prisma known request errors
  if (err && typeof err.code === 'string') {
    switch (err.code) {
      case 'P2002': // unique constraint failed
        return res.status(409).json({ error: uniqueMessage(err.meta?.target) })
      case 'P2025': // record not found
        return res.status(404).json({ error: 'Record not found' })
      case 'P2003': // foreign key constraint failed
        return res.status(400).json({ error: 'Related record does not exist or is still in use' })
    }
  }

  // Unknown / unexpected errors: log server-side, return a generic message.
  console.error(err)
  const status = err?.statusCode || 500
  const message =
    status === 500
      ? 'Internal Server Error'
      : err?.message || 'Request failed'
  res.status(status).json({ error: message })
}
