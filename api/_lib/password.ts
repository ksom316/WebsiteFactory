import { scrypt, timingSafeEqual } from 'node:crypto'

const SCRYPT_KEY_LENGTH = 64

function scryptAsync(password: string, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, SCRYPT_KEY_LENGTH, (error, derivedKey) => {
      if (error) reject(error)
      else resolve(derivedKey)
    })
  })
}

/**
 * Verifies a plaintext password against a hash produced by `npm run db:hash-password`,
 * in the form `scrypt:<saltHex>:<hashHex>`.
 */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const parts = storedHash.split(':')
  if (parts.length !== 3 || parts[0] !== 'scrypt') return false

  const [, saltHex, hashHex] = parts
  try {
    const salt = Buffer.from(saltHex, 'hex')
    const expected = Buffer.from(hashHex, 'hex')
    if (expected.length !== SCRYPT_KEY_LENGTH) return false
    const actual = await scryptAsync(password, salt)
    return timingSafeEqual(actual, expected)
  } catch {
    return false
  }
}
