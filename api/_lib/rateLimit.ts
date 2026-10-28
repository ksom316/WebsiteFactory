/**
 * In-memory, per-instance login rate limiter.
 *
 * LIMITATION: serverless functions can run as multiple concurrent instances and are
 * recycled on cold start, so this counter is NOT a globally reliable limit in production —
 * it only throttles repeated attempts handled by the same warm instance. For a robust
 * production limit, back this with a shared store (e.g. Vercel KV / Upstash Redis). That
 * infrastructure is intentionally not added here to avoid an unnecessary paid dependency
 * for a single-owner internal tool; this is a documented limitation, not an oversight.
 */

const WINDOW_MS = 15 * 60 * 1000
const MAX_ATTEMPTS = 10
/** Once the map holds this many distinct keys, opportunistically drop expired ones
 * before inserting a new one — otherwise a long-lived warm instance seeing many
 * distinct IPs over time would grow this map forever, since a key is never removed
 * just because its window expired (only overwritten on that key's next attempt). */
const PRUNE_THRESHOLD = 5000

interface Bucket {
  count: number
  windowStart: number
}

const buckets = new Map<string, Bucket>()

function pruneExpired(now: number): void {
  for (const [key, bucket] of buckets) {
    if (now - bucket.windowStart > WINDOW_MS) buckets.delete(key)
  }
}

export function isRateLimited(key: string): boolean {
  const now = Date.now()
  const bucket = buckets.get(key)

  if (!bucket || now - bucket.windowStart > WINDOW_MS) {
    if (buckets.size >= PRUNE_THRESHOLD) pruneExpired(now)
    buckets.set(key, { count: 1, windowStart: now })
    return false
  }

  bucket.count += 1
  return bucket.count > MAX_ATTEMPTS
}
