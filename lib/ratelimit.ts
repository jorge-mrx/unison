import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

type LimitResult = {
  success: boolean;
  remaining: number;
  reset: number;
};

const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;

const enabled = Boolean(url && token);

const redis = enabled
  ? new Redis({ url: url!, token: token! })
  : null;

export const guestUploadRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(20, "1 h"),
      analytics: true,
      prefix: "unison:guest-upload",
    })
  : null;

export async function checkGuestUploadLimit(identifier: string): Promise<LimitResult> {
  if (!guestUploadRateLimit) {
    return { success: true, remaining: 20, reset: 0 };
  }
  const result = await guestUploadRateLimit.limit(identifier);
  return {
    success: result.success,
    remaining: result.remaining,
    reset: result.reset,
  };
}
