/**
 * LAYER 7 — RATE LIMITING
 * --------------------------
 * Sliding-window limiter keyed by client identifier (IP by default).
 *
 * The default implementation is in-memory, which is fine for a single
 * server instance / demo deployment, but will NOT coordinate across
 * multiple serverless instances or horizontal replicas. The
 * `RateLimiter` interface is intentionally storage-agnostic so it can be
 * swapped for a Redis- or Upstash-backed sliding window in production
 * without touching call sites.
 */

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterMs: number;
}

export interface RateLimiter {
  check(key: string): RateLimitResult;
}

interface WindowEntry {
  timestamps: number[];
}

export function createInMemoryRateLimiter(opts: {
  maxRequests: number;
  windowMs: number;
  /** Upper bound on tracked keys to prevent unbounded memory growth. */
  maxTrackedKeys?: number;
}): RateLimiter {
  const { maxRequests, windowMs, maxTrackedKeys = 10_000 } = opts;
  const store = new Map<string, WindowEntry>();

  function prune(now: number, entry: WindowEntry) {
    const cutoff = now - windowMs;
    while (entry.timestamps.length > 0 && (entry.timestamps[0] as number) < cutoff) {
      entry.timestamps.shift();
    }
  }

  return {
    check(key: string): RateLimitResult {
      const now = Date.now();

      if (!store.has(key)) {
        if (store.size >= maxTrackedKeys) {
          // Evict the oldest-inserted key to bound memory usage. Map
          // preserves insertion order, so the first key is the oldest.
          const oldestKey = store.keys().next().value;
          if (oldestKey !== undefined) store.delete(oldestKey);
        }
        store.set(key, { timestamps: [] });
      }

      const entry = store.get(key) as WindowEntry;
      prune(now, entry);

      if (entry.timestamps.length >= maxRequests) {
        const oldest = entry.timestamps[0] as number;
        return { allowed: false, remaining: 0, retryAfterMs: Math.max(0, oldest + windowMs - now) };
      }

      entry.timestamps.push(now);
      return { allowed: true, remaining: maxRequests - entry.timestamps.length, retryAfterMs: 0 };
    },
  };
}
