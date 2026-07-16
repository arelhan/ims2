// Centralized environment/config validation.
// Fails fast at startup instead of throwing deep inside a request handler.
import crypto from 'crypto'

const INSECURE_SECRETS = new Set([
  'change-this-to-a-secure-random-string',
  'degistir-bunu-guclu-bir-secret-yap',
  'secret',
  'changeme',
])

function resolveJwtSecret(): string {
  const secret = process.env.JWT_SECRET
  const isProd = process.env.NODE_ENV === 'production'

  if (!secret || secret.trim().length === 0) {
    if (isProd) {
      throw new Error(
        'JWT_SECRET is not set. Refusing to start in production without a secret.'
      )
    }
    console.warn(
      '\n  ⚠  JWT_SECRET is not set — using a random ephemeral secret.\n' +
        '     Tokens will be invalidated on every restart. Set JWT_SECRET in your .env.\n'
    )
    // Ephemeral dev secret so local development still works.
    return crypto.randomBytes(48).toString('base64')
  }

  if (INSECURE_SECRETS.has(secret) || secret.length < 16) {
    if (isProd) {
      throw new Error(
        'JWT_SECRET is weak or uses the default placeholder value. ' +
          'Set a strong, random secret (32+ chars) before deploying.'
      )
    }
    console.warn('\n  ⚠  JWT_SECRET is weak/default. Change it before deploying to production.\n')
  }

  return secret
}

export const config = {
  jwtSecret: resolveJwtSecret(),
  isProd: process.env.NODE_ENV === 'production',
  cookieSecure: process.env.COOKIE_SECURE === 'true',
  port: Number(process.env.PORT) || 4000,
}
