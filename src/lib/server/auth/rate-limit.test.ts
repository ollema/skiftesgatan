import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { RefillingTokenBucket, Throttler, ExpiringTokenBucket } from '$lib/server/auth/rate-limit';

describe('RefillingTokenBucket', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should allow consumption when bucket is empty (first time)', () => {
    const bucket = new RefillingTokenBucket(10, 60);

    const result = bucket.consume('user1', 5);
    expect(result).toBe(true);
  });

  it('should check tokens without consuming them', () => {
    const bucket = new RefillingTokenBucket(10, 60);

    // first check should pass (bucket doesn't exist yet)
    expect(bucket.check('user1', 5)).toBe(true);

    // consume some tokens
    bucket.consume('user1', 8);

    // check should return true for available tokens
    expect(bucket.check('user1', 2)).toBe(true);

    // check should return false for unavailable tokens
    expect(bucket.check('user1', 5)).toBe(false);
  });

  it('should prevent consumption when insufficient tokens', () => {
    const bucket = new RefillingTokenBucket(10, 60);

    // consume most tokens
    bucket.consume('user1', 8);

    // should allow consumption within remaining limit
    expect(bucket.consume('user1', 2)).toBe(true);

    // should prevent consumption when no tokens left
    expect(bucket.consume('user1', 1)).toBe(false);
  });

  it('should refill tokens over time', () => {
    const bucket = new RefillingTokenBucket(10, 60); // refill every 60 seconds

    // consume all tokens
    bucket.consume('user1', 10); // count = 0
    expect(bucket.consume('user1', 1)).toBe(false);

    // advance time by 60 seconds (1 refill)
    vi.advanceTimersByTime(60 * 1000);
    expect(bucket.consume('user1', 1)).toBe(true); // count goes to 1, then 0 after consumption

    // advance time by another 120 seconds (2 more refills)
    vi.advanceTimersByTime(120 * 1000);
    expect(bucket.consume('user1', 2)).toBe(true); // count goes to 2, should allow consuming 2
  });

  it('should cap refill at maximum capacity', () => {
    const bucket = new RefillingTokenBucket(5, 10); // max 5, refill every 10 seconds

    // consume some tokens
    bucket.consume('user1', 3);

    // wait much longer than needed for full refill
    vi.advanceTimersByTime(100 * 1000); // 100 seconds = 10 refill cycles

    // should only be able to consume max capacity
    expect(bucket.consume('user1', 5)).toBe(true);
    expect(bucket.consume('user1', 1)).toBe(false);
  });

  it('should handle multiple keys independently', () => {
    const bucket = new RefillingTokenBucket(10, 60);

    // consume tokens for different users
    bucket.consume('user1', 8);
    bucket.consume('user2', 5);

    // each user should have their own bucket
    expect(bucket.consume('user1', 3)).toBe(false); // user1 has 2 left
    expect(bucket.consume('user2', 3)).toBe(true);  // user2 has 5 left
  });

  it('should handle fractional refill intervals correctly', () => {
    const bucket = new RefillingTokenBucket(10, 1); // refill every second

    bucket.consume('user1', 10); // consume all tokens, count = 0, refilledAt = T0

    // advance by less than refill interval
    vi.advanceTimersByTime(500); // 0.5 seconds, now at T0+500
    expect(bucket.consume('user1', 1)).toBe(false); // No refill yet, refilledAt updates to T0+500

    // advance by another full interval from the last consume call
    vi.advanceTimersByTime(1000); // 1 second from last call, total T0+1500
    expect(bucket.consume('user1', 1)).toBe(true); // 1 token available (1000ms elapsed since last consume)
  });

  it('should handle zero cost consumption', () => {
    const bucket = new RefillingTokenBucket(10, 60);

    expect(bucket.consume('user1', 0)).toBe(true);
    expect(bucket.check('user1', 0)).toBe(true);
  });

  it('should handle cost greater than max capacity', () => {
    const bucket = new RefillingTokenBucket(5, 60);

    // first consumption always succeeds even if cost > max (creates bucket with negative count)
    expect(bucket.consume('user1', 10)).toBe(true);

    // subsequent consumptions should fail since bucket has negative count
    expect(bucket.consume('user1', 1)).toBe(false);

    // check should also fail for costs exceeding what's available
    expect(bucket.check('user1', 1)).toBe(false);
  });
});

describe('Throttler', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should allow first consumption immediately', () => {
    const throttler = new Throttler([1, 2, 4]); // 1s, 2s, 4s timeouts

    expect(throttler.consume('user1')).toBe(true);
  });

  it('should block consumption within timeout period', () => {
    const throttler = new Throttler([2, 4, 8]);

    // first consumption allowed
    expect(throttler.consume('user1')).toBe(true);

    // second consumption blocked within timeout
    expect(throttler.consume('user1')).toBe(false);

    // still blocked after partial timeout
    vi.advanceTimersByTime(1000); // 1 second
    expect(throttler.consume('user1')).toBe(false);

    // allowed after full timeout
    vi.advanceTimersByTime(1000); // total 2 seconds
    expect(throttler.consume('user1')).toBe(true);
  });

  it('should escalate timeout periods', () => {
    const throttler = new Throttler([1, 3, 5]);

    // first consumption - timeout will be 1s
    throttler.consume('user1');

    // wait for first timeout, consume again - timeout will be 3s
    vi.advanceTimersByTime(1000);
    throttler.consume('user1');

    // should be blocked for 3 seconds now
    vi.advanceTimersByTime(1000);
    expect(throttler.consume('user1')).toBe(false);

    vi.advanceTimersByTime(2000); // total 3 seconds
    expect(throttler.consume('user1')).toBe(true);
  });

  it('should cap timeout at maximum level', () => {
    const throttler = new Throttler([1, 2]);

    // escalate to maximum timeout level
    throttler.consume('user1'); // timeout = 1s
    vi.advanceTimersByTime(1000);
    throttler.consume('user1'); // timeout = 2s
    vi.advanceTimersByTime(2000);
    throttler.consume('user1'); // timeout should stay at 2s (max)

    // should still use max timeout
    vi.advanceTimersByTime(1000);
    expect(throttler.consume('user1')).toBe(false);
    vi.advanceTimersByTime(1000); // total 2 seconds
    expect(throttler.consume('user1')).toBe(true);
  });

  it('should handle multiple keys independently', () => {
    const throttler = new Throttler([2, 4]);

    // both users start fresh
    expect(throttler.consume('user1')).toBe(true);
    expect(throttler.consume('user2')).toBe(true);

    // both should be throttled independently
    expect(throttler.consume('user1')).toBe(false);
    expect(throttler.consume('user2')).toBe(false);

    // advance time and verify they're still independent
    vi.advanceTimersByTime(2000);
    expect(throttler.consume('user1')).toBe(true);
    expect(throttler.consume('user2')).toBe(true);
  });

  it('should reset throttling for a key', () => {
    const throttler = new Throttler([5, 10]);

    // trigger throttling
    throttler.consume('user1');
    expect(throttler.consume('user1')).toBe(false);

    // reset should allow immediate consumption
    throttler.reset('user1');
    expect(throttler.consume('user1')).toBe(true);
  });

  it('should handle edge case with single timeout value', () => {
    const throttler = new Throttler([3]);

    throttler.consume('user1');

    // multiple escalations should stay at the single timeout value
    vi.advanceTimersByTime(3000);
    throttler.consume('user1');
    vi.advanceTimersByTime(3000);
    throttler.consume('user1');

    // should still use the same timeout
    expect(throttler.consume('user1')).toBe(false);
    vi.advanceTimersByTime(3000);
    expect(throttler.consume('user1')).toBe(true);
  });
});

describe('ExpiringTokenBucket', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should allow consumption when bucket is empty (first time)', () => {
    const bucket = new ExpiringTokenBucket(10, 300); // 10 tokens, expires in 5 minutes

    expect(bucket.consume('user1', 5)).toBe(true);
  });

  it('should check tokens without consuming them', () => {
    const bucket = new ExpiringTokenBucket(10, 300);

    // first check should pass (no bucket exists)
    expect(bucket.check('user1', 5)).toBe(true);

    // consume some tokens
    bucket.consume('user1', 8);

    // check should reflect remaining tokens
    expect(bucket.check('user1', 2)).toBe(true);
    expect(bucket.check('user1', 5)).toBe(false);
  });

  it('should prevent consumption when insufficient tokens', () => {
    const bucket = new ExpiringTokenBucket(10, 300);

    // consume most tokens
    bucket.consume('user1', 8);

    // should allow within remaining limit
    expect(bucket.consume('user1', 2)).toBe(true);

    // should prevent when no tokens left
    expect(bucket.consume('user1', 1)).toBe(false);
  });

  it('should reset bucket after expiration', () => {
    const bucket = new ExpiringTokenBucket(10, 60); // expires in 60 seconds

    // consume all tokens
    bucket.consume('user1', 10);
    expect(bucket.consume('user1', 1)).toBe(false);

    // before expiration - still blocked
    vi.advanceTimersByTime(30 * 1000);
    expect(bucket.consume('user1', 1)).toBe(false);

    // after expiration - should reset
    vi.advanceTimersByTime(30 * 1000); // total 60 seconds
    expect(bucket.consume('user1', 5)).toBe(true);
  });

  it('should handle check after expiration', () => {
    const bucket = new ExpiringTokenBucket(5, 30);

    // consume some tokens
    bucket.consume('user1', 4);
    expect(bucket.check('user1', 2)).toBe(false);

    // after expiration, check should pass
    vi.advanceTimersByTime(30 * 1000);
    expect(bucket.check('user1', 5)).toBe(true);
  });

  it('should handle multiple keys independently', () => {
    const bucket = new ExpiringTokenBucket(10, 300);

    // consume tokens for different users
    bucket.consume('user1', 8);
    bucket.consume('user2', 5);

    // each should have independent buckets
    expect(bucket.consume('user1', 3)).toBe(false); // user1 has 2 left
    expect(bucket.consume('user2', 3)).toBe(true);  // user2 has 5 left
  });

  it('should reset specific key', () => {
    const bucket = new ExpiringTokenBucket(10, 300);

    // consume tokens for multiple users
    bucket.consume('user1', 8);
    bucket.consume('user2', 8);

    // reset one user
    bucket.reset('user1');

    // User1 should be reset, user2 should still be limited
    expect(bucket.consume('user1', 5)).toBe(true);
    expect(bucket.consume('user2', 5)).toBe(false);
  });

  it('should handle zero cost consumption', () => {
    const bucket = new ExpiringTokenBucket(10, 300);

    expect(bucket.consume('user1', 0)).toBe(true);
    expect(bucket.check('user1', 0)).toBe(true);
  });

  it('should handle cost greater than max capacity', () => {
    const bucket = new ExpiringTokenBucket(5, 300);

    // first consumption always succeeds even if cost > max (creates bucket with negative count)
    expect(bucket.consume('user1', 10)).toBe(true);

    // subsequent consumptions should fail since bucket has negative count  
    expect(bucket.consume('user1', 1)).toBe(false);

    // check should also fail for costs exceeding what's available
    expect(bucket.check('user1', 1)).toBe(false);
  });

  it('should handle bucket expiration edge case', () => {
    const bucket = new ExpiringTokenBucket(10, 60);

    // consume tokens
    bucket.consume('user1', 7);

    // right at expiration boundary
    vi.advanceTimersByTime(59 * 1000 + 999); // 59.999 seconds
    expect(bucket.consume('user1', 5)).toBe(false); // still expired

    vi.advanceTimersByTime(1); // Exactly 60 seconds
    expect(bucket.consume('user1', 5)).toBe(true); // now reset
  });
});

describe('Rate limiting integration scenarios', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should handle realistic API rate limiting scenario', () => {
    // 100 requests per hour, refill every minute
    const bucket = new RefillingTokenBucket(100, 60);

    // burst usage
    for (let i = 0; i < 50; i++) {
      expect(bucket.consume('api-user', 1)).toBe(true);
    }

    // continued usage should be limited
    for (let i = 0; i < 60; i++) {
      expect(bucket.consume('api-user', 1)).toBe(i < 50);
    }

    // after time passes, more requests should be available
    vi.advanceTimersByTime(5 * 60 * 1000); // 5 minutes = 5 refills
    for (let i = 0; i < 5; i++) {
      expect(bucket.consume('api-user', 1)).toBe(true);
    }
  });

  it('should handle login attempt throttling scenario', () => {
    // progressive delays: 1s, 5s, 15s, 60s
    const throttler = new Throttler([1, 5, 15, 60]);

    // simulate failed login attempts
    expect(throttler.consume('192.168.1.1')).toBe(true); // first attempt

    vi.advanceTimersByTime(1000); // wait 1 second
    expect(throttler.consume('192.168.1.1')).toBe(true); // second attempt

    vi.advanceTimersByTime(5000); // wait 5 seconds  
    expect(throttler.consume('192.168.1.1')).toBe(true); // third attempt

    // now should wait 15 seconds
    vi.advanceTimersByTime(10000); // only 10 seconds
    expect(throttler.consume('192.168.1.1')).toBe(false);

    vi.advanceTimersByTime(5000); // total 15 seconds
    expect(throttler.consume('192.168.1.1')).toBe(true);
  });
});