interface RateLimitRecord {
  timestamps: number[];
  dayCount: number;
  lastResetDay: number;
}

const rateLimitStore = new Map<string, RateLimitRecord>();

export interface RateLimitOptions {
  key: string;
  maxPerMinute?: number;
  maxPerDay?: number;
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetSeconds: number;
  reason?: string;
}

export function checkRateLimit(options: RateLimitOptions): RateLimitResult {
  const { key, maxPerMinute = 20, maxPerDay = 500 } = options;
  const now = Date.now();
  const currentDay = Math.floor(now / (1000 * 60 * 60 * 24));

  let record = rateLimitStore.get(key);
  if (!record) {
    record = {
      timestamps: [],
      dayCount: 0,
      lastResetDay: currentDay,
    };
    rateLimitStore.set(key, record);
  }

  // Reset daily count if day rolled over
  if (record.lastResetDay !== currentDay) {
    record.dayCount = 0;
    record.lastResetDay = currentDay;
  }

  // Filter out timestamps older than 60 seconds
  const oneMinuteAgo = now - 60 * 1000;
  record.timestamps = record.timestamps.filter((ts) => ts > oneMinuteAgo);

  // Check 1: Day Limit
  if (record.dayCount >= maxPerDay) {
    return {
      allowed: false,
      limit: maxPerDay,
      remaining: 0,
      resetSeconds: Math.ceil(((currentDay + 1) * 86400000 - now) / 1000),
      reason: `Daily quota of ${maxPerDay} requests exceeded. Resets at midnight.`,
    };
  }

  // Check 2: Minute Limit
  if (record.timestamps.length >= maxPerMinute) {
    const oldestTimestamp = record.timestamps[0];
    const resetSeconds = Math.max(1, Math.ceil((oldestTimestamp + 60000 - now) / 1000));
    return {
      allowed: false,
      limit: maxPerMinute,
      remaining: 0,
      resetSeconds,
      reason: `Rate limit of ${maxPerMinute} requests/minute reached. Please slow down.`,
    };
  }

  // Allowed: Record hit
  record.timestamps.push(now);
  record.dayCount++;

  return {
    allowed: true,
    limit: maxPerMinute,
    remaining: Math.max(0, maxPerMinute - record.timestamps.length),
    resetSeconds: 60,
  };
}
