import { Request, Response, NextFunction } from 'express'

// Lightweight in-memory rate limiter (no external dependency).
// Suitable for a single-process LAN deployment. For multi-instance
// deployments, swap the backing store for Redis.

interface Bucket {
  count: number
  resetAt: number
}

interface RateLimitOptions {
  windowMs: number
  max: number
  message?: string
  // When true, successful (2xx/3xx) responses do not count toward the limit.
  skipSuccessful?: boolean
}

function clientKey(req: Request): string {
  // Express sets req.ip; fall back to socket address.
  const fwd = (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim()
  return fwd || req.ip || req.socket.remoteAddress || 'unknown'
}

export function rateLimit(options: RateLimitOptions) {
  const { windowMs, max, message = 'Too many requests, please try again later.', skipSuccessful = false } = options
  const store = new Map<string, Bucket>()

  // Periodically evict expired buckets so the map does not grow unbounded.
  const sweep = setInterval(() => {
    const now = Date.now()
    for (const [key, bucket] of store) {
      if (bucket.resetAt <= now) store.delete(key)
    }
  }, windowMs)
  // Do not keep the event loop alive just for the sweeper.
  if (typeof sweep.unref === 'function') sweep.unref()

  return function rateLimitMiddleware(req: Request, res: Response, next: NextFunction) {
    const key = clientKey(req)
    const now = Date.now()
    let bucket = store.get(key)

    if (!bucket || bucket.resetAt <= now) {
      bucket = { count: 0, resetAt: now + windowMs }
      store.set(key, bucket)
    }

    if (bucket.count >= max) {
      const retryAfter = Math.ceil((bucket.resetAt - now) / 1000)
      res.setHeader('Retry-After', String(retryAfter))
      return res.status(429).json({ error: message })
    }

    if (skipSuccessful) {
      // Only count the request if it failed (used for login/reset to avoid
      // locking out legitimate users while still throttling guessing).
      res.on('finish', () => {
        if (res.statusCode >= 400) bucket!.count += 1
      })
    } else {
      bucket.count += 1
    }

    next()
  }
}

// Strict limiter for authentication-sensitive endpoints (login, password reset).
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  skipSuccessful: true,
  message: 'Too many attempts. Please wait a few minutes and try again.',
})

// General API limiter to blunt scraping / abuse. Deliberately generous because
// front-ends proxy many browser requests through a single host (shared bucket).
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 600,
})
