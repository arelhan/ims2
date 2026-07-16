import { Request, Response, NextFunction } from 'express'

// Minimal security headers (a dependency-free subset of what `helmet` sets).
// Kept intentionally small so it works for a JSON API without breaking the
// separate Next.js front-ends that consume it.
export function securityHeaders(_req: Request, res: Response, next: NextFunction) {
  // Prevent MIME-type sniffing.
  res.setHeader('X-Content-Type-Options', 'nosniff')
  // Disallow the API from being framed (clickjacking).
  res.setHeader('X-Frame-Options', 'DENY')
  // Do not leak referrer to third parties.
  res.setHeader('Referrer-Policy', 'no-referrer')
  // Restrict powerful browser features for any HTML this API might serve.
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  // Hide the Express fingerprint.
  res.removeHeader('X-Powered-By')
  next()
}
