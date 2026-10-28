// @vitest-environment node
import { describe, expect, it, vi } from 'vitest'
import { isRateLimited } from './rateLimit'

describe('isRateLimited', () => {
  it('allows the first 10 attempts in a window and blocks the 11th', () => {
    const key = `test-${Math.random()}`
    for (let i = 0; i < 10; i++) {
      expect(isRateLimited(key)).toBe(false)
    }
    expect(isRateLimited(key)).toBe(true)
  })

  it('tracks distinct keys independently', () => {
    const a = `test-a-${Math.random()}`
    const b = `test-b-${Math.random()}`
    for (let i = 0; i < 10; i++) isRateLimited(a)
    expect(isRateLimited(a)).toBe(true)
    expect(isRateLimited(b)).toBe(false)
  })

  it('keeps working correctly after a large prune pass, once the map grows past the threshold', () => {
    // `buckets` is module-private, so this can't assert the map actually shrank — it
    // asserts the prune code path (triggered by crossing PRUNE_THRESHOLD) runs without
    // error and doesn't corrupt rate-limiting for an unrelated key afterward.
    vi.useFakeTimers()
    try {
      for (let i = 0; i < 5100; i++) {
        isRateLimited(`seed-${i}-${Math.random()}`)
      }
      vi.advanceTimersByTime(16 * 60 * 1000) // past the 15-minute window, so seeded entries are stale

      const freshKey = `fresh-${Math.random()}`
      for (let i = 0; i < 10; i++) {
        expect(isRateLimited(freshKey)).toBe(false)
      }
      expect(isRateLimited(freshKey)).toBe(true)
    } finally {
      vi.useRealTimers()
    }
  })
})
