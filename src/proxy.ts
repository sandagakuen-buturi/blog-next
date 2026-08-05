import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

// ここでは「ログイン済みかどうか」の楽観的チェックのみを行う。
// 権限(ロール/Visibility)の正式な判定は各Server Component/Server Action/Route Handler側の
// verifySession()(src/lib/dal.ts)で必ず行うこと。
const PUBLIC_PATHS = ["/login", "/api/auth"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PATHS.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  const sessionCookie = getSessionCookie(request);
  if (!sessionCookie) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
