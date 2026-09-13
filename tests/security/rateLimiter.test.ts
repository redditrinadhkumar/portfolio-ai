import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createInMemoryRateLimiter } from '@/lib/security/rateLimiter';

describe('rate limiter (layer 7)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('allows requests under the limit', () => {
    const limiter = createInMemoryRateLimiter({ maxRequests: 3, windowMs: 60_000 });
    expect(limiter.check('client-a').allowed).toBe(true);
    expect(limiter.check('client-a').allowed).toBe(true);
    expect(limiter.check('client-a').allowed).toBe(true);
  });

  it('blocks requests once the limit is exceeded (rate-limit abuse)', () => {
    const limiter = createInMemoryRateLimiter({ maxRequests: 3, windowMs: 60_000 });
    limiter.check('client-b');
    limiter.check('client-b');
    limiter.check('client-b');
    const fourth = limiter.check('client-b');
    expect(fourth.allowed).toBe(false);
    expect(fourth.retryAfterMs).toBeGreaterThan(0);
  });

  it('tracks separate clients independently', () => {
    const limiter = createInMemoryRateLimiter({ maxRequests: 1, windowMs: 60_000 });
    expect(limiter.check('client-x').allowed).toBe(true);
    expect(limiter.check('client-y').allowed).toBe(true);
    expect(limiter.check('client-x').allowed).toBe(false);
  });

  it('resets the window after time passes', () => {
    const limiter = createInMemoryRateLimiter({ maxRequests: 1, windowMs: 60_000 });
    expect(limiter.check('client-z').allowed).toBe(true);
    expect(limiter.check('client-z').allowed).toBe(false);

    vi.advanceTimersByTime(61_000);

    expect(limiter.check('client-z').allowed).toBe(true);
  });
});
