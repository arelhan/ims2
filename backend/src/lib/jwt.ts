import jwt from 'jsonwebtoken'
import { config } from './config'

export interface JwtPayload {
  id: string
  role: 'ADMIN'
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, config.jwtSecret, { expiresIn: '7d' })
}

export function verifyTokenUtil(token: string): JwtPayload {
  return jwt.verify(token, config.jwtSecret) as JwtPayload
}
