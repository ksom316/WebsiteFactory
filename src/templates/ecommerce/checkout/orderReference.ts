/**
 * A client-side-only, cosmetic reference for the simulated order confirmation screen
 * — never persisted anywhere (not to storage, not to a server; there is no server).
 * It exists purely so the demo confirmation screen has something to show, exactly
 * like a real checkout would, without implying any order was actually recorded.
 */
export function generateDemoOrderReference(): string {
  const timePart = Date.now().toString(36).toUpperCase()
  const randomPart = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `DEMO-${timePart}-${randomPart}`
}
