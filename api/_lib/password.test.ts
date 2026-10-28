// @vitest-environment node
import { scryptSync, randomBytes } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { verifyPassword } from './password'

function hashPassword(password: string): string {
  const salt = randomBytes(16)
  const hash = scryptSync(password, salt, 64)
  return `scrypt:${salt.toString('hex')}:${hash.toString('hex')}`
}

describe('verifyPassword', () => {
  it('accepts the correct password', async () => {
    const stored = hashPassword('correct-horse-battery-staple')
    expect(await verifyPassword('correct-horse-battery-staple', stored)).toBe(true)
  })

  it('rejects an incorrect password', async () => {
    const stored = hashPassword('correct-horse-battery-staple')
    expect(await verifyPassword('wrong-password', stored)).toBe(false)
  })

  it('rejects a malformed stored hash', async () => {
    expect(await verifyPassword('anything', 'not-a-valid-hash')).toBe(false)
  })

  it('rejects an empty stored hash', async () => {
    expect(await verifyPassword('anything', '')).toBe(false)
  })
})
