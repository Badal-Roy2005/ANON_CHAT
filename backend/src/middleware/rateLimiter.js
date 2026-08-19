import { Ratelimit } from '@upstash/ratelimit';
import redis, { isMockStore } from '../config/redis.js';

const PER_SESSION_LIMIT = 5;
const PER_SESSION_WINDOW = '10 s';
const PER_SESSION_WINDOW_MS = 10_000;
const PER_IP_LIMIT = 30;
const PER_IP_WINDOW = '1 m';
const PER_IP_WINDOW_MS = 60_000;

class InMemoryRateLimiter {
  constructor() {
    this.counters = new Map();
  }

  check(key, limit, windowMs) {
    const now = Date.now();
    const timestamps = (this.counters.get(key) || []).filter(
      (timestamp) => now - timestamp < windowMs
    );
    if (timestamps.length >= limit) {
      this.counters.set(key, timestamps);
      return { allowed: false, remaining: 0 };
    }
    timestamps.push(now);
    this.counters.set(key, timestamps);
    return { allowed: true, remaining: limit - timestamps.length };
  }
}

const mockLimiter = isMockStore ? new InMemoryRateLimiter() : null;

let sessionLimiter = null;
let ipLimiter = null;

if (!isMockStore) {
  sessionLimiter = new Ratelimit({
    ctx: { redis, prefix: 'rl:session' },
    limiter: Ratelimit.slidingWindow(PER_SESSION_LIMIT, PER_SESSION_WINDOW),
  });
  ipLimiter = new Ratelimit({
    ctx: { redis, prefix: 'rl:ip' },
    limiter: Ratelimit.slidingWindow(PER_IP_LIMIT, PER_IP_WINDOW),
  });
}

function isValidIdentifier(value) {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= 128;
}

export async function checkRateLimit(sessionId, hashedIp) {
  if (!isValidIdentifier(sessionId)) {
    throw new Error('checkRateLimit: sessionId must be a non-empty string');
  }
  if (!isValidIdentifier(hashedIp)) {
    throw new Error('checkRateLimit: hashedIp must be a non-empty string');
  }

  if (mockLimiter) {
    const session = mockLimiter.check(
      `session:${sessionId}`,
      PER_SESSION_LIMIT,
      PER_SESSION_WINDOW_MS
    );
    const ip = mockLimiter.check(`ip:${hashedIp}`, PER_IP_LIMIT, PER_IP_WINDOW_MS);
    return {
      allowed: session.allowed && ip.allowed,
      remaining: Math.min(session.remaining, ip.remaining),
    };
  }

  const [session, ip] = await Promise.all([
    sessionLimiter.limit(sessionId),
    ipLimiter.limit(hashedIp),
  ]);

  return {
    allowed: session.success && ip.success,
    remaining: Math.min(session.remaining, ip.remaining),
  };
}