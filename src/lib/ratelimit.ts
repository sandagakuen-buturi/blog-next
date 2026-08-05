import "server-only";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

const limiters = new Map<string, Ratelimit>();

/**
 * アクション種別ごとにレート制限をかける。Upstashが未設定(ローカル開発でキー未設定)の場合は
 * 素通りさせる — 開発体験を優先し、本番ではUPSTASH_*を必ず設定する前提。
 */
function getLimiter(action: string, limit: number, windowSeconds: number): Ratelimit | null {
  if (!redis) return null;
  const cacheKey = `${action}:${limit}:${windowSeconds}`;
  const cached = limiters.get(cacheKey);
  if (cached) return cached;

  const limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(limit, `${windowSeconds} s`),
    prefix: `ratelimit:${action}`,
  });
  limiters.set(cacheKey, limiter);
  return limiter;
}

/**
 * identifier(通常はユーザーID、未ログイン操作ならIP)ごとに action の呼び出し回数を制限する。
 * 制限に達した場合は例外を投げる — 呼び出し側はServer Action/Route Handlerの冒頭で呼ぶこと。
 */
export async function enforceRateLimit(
  action: string,
  identifier: string,
  limit: number,
  windowSeconds: number,
) {
  const limiter = getLimiter(action, limit, windowSeconds);
  if (!limiter) return;

  const { success } = await limiter.limit(identifier);
  if (!success) {
    throw new Error("操作が多すぎます。しばらく待ってから再度お試しください。");
  }
}
