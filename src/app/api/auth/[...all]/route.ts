import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";
import { enforceRateLimit } from "@/lib/ratelimit";

const { GET, POST: authPost } = toNextJsHandler(auth);

export { GET };

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  try {
    await enforceRateLimit("auth", ip, 20, 300);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "レート制限に達しました。" },
      { status: 429 },
    );
  }

  return authPost(request);
}
