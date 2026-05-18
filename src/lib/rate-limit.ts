const rateLimit = new Map<string, { count: number; lastReset: number }>();

const MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_MAX || "100");
const WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000"); // 15 min

export function checkRateLimit(identifier: string): {
  allowed: boolean;
  remaining: number;
} {
  const now = Date.now();
  const record = rateLimit.get(identifier);

  if (!record || now - record.lastReset > WINDOW_MS) {
    rateLimit.set(identifier, { count: 1, lastReset: now });
    return { allowed: true, remaining: MAX_REQUESTS - 1 };
  }

  if (record.count >= MAX_REQUESTS) {
    return { allowed: false, remaining: 0 };
  }

  record.count++;
  return { allowed: true, remaining: MAX_REQUESTS - record.count };
}

// Cleanup old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimit.entries()) {
    if (now - value.lastReset > WINDOW_MS) {
      rateLimit.delete(key);
    }
  }
}, 60000);
