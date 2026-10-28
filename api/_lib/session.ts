import { jwtVerify, SignJWT } from 'jose'
import { requireEnv } from './env.js'

export const SESSION_COOKIE = 'wf_session'
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7 // 7 days
const ISSUER = 'website-factory'
const SUBJECT = 'admin'

let cachedSecret: Uint8Array | null = null

function getSecretKey(): Uint8Array {
  if (cachedSecret) return cachedSecret
  const secret = requireEnv('SESSION_SECRET')
  if (secret.length < 32) {
    throw new Error('SESSION_SECRET must be at least 32 characters long.')
  }
  cachedSecret = new TextEncoder().encode(secret)
  return cachedSecret
}

export async function createSessionToken(): Promise<string> {
  return new SignJWT({})
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuer(ISSUER)
    .setSubject(SUBJECT)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(getSecretKey())
}

export async function verifySessionToken(token: string): Promise<boolean> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey(), { issuer: ISSUER, subject: SUBJECT })
    return payload.sub === SUBJECT
  } catch {
    return false
  }
}
