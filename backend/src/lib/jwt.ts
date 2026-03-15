import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET!

export interface JwtPayload {
  id: string
  role: 'ADMIN' | 'VIEWER'
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}

export function verifyTokenUtil(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET) as JwtPayload
}
