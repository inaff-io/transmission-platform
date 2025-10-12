type Bucket = { count: number; resetAt: number };

const buckets: Map<string, Bucket> = new Map();

export type RateLimitInfo = {
  limit: number;
  remaining: number;
  resetAt: number;
};

export function rateLimit(key: string, limit = 10, windowMs = 60_000): {
  allowed: boolean;
  info: RateLimitInfo;
} {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now >= bucket.resetAt) {
    const newBucket: Bucket = { count: 0, resetAt: now + windowMs };
    buckets.set(key, newBucket);
    return {
      allowed: true,
      info: { limit, remaining: limit - 1, resetAt: newBucket.resetAt }
    };
  }

  if (bucket.count >= limit) {
    return {
      allowed: false,
      info: { limit, remaining: 0, resetAt: bucket.resetAt }
    };
  }

  bucket.count += 1;
  return {
    allowed: true,
    info: { limit, remaining: Math.max(0, limit - bucket.count), resetAt: bucket.resetAt }
  };
}

export function buildRateLimitHeaders(info: RateLimitInfo): Record<string, string> {
  return {
    'X-RateLimit-Limit': String(info.limit),
    'X-RateLimit-Remaining': String(info.remaining),
    'X-RateLimit-Reset': String(Math.ceil(info.resetAt / 1000)),
  };
}