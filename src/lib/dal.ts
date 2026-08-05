import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission, type PermissionFlag } from "@/lib/permissions";

export type SessionUser = Awaited<ReturnType<typeof loadSessionUser>>;

async function loadSessionUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { role: true },
  });
  return user;
}

/**
 * 全てのServer Component/Server Action/Route Handlerが認可の起点として呼ぶ唯一の関数。
 * proxy.ts はクッキーの有無しか見ていないため、権限の正式判定は必ずここを経由する。
 */
export const verifySession = cache(async () => {
  const user = await loadSessionUser();
  if (!user) {
    redirect("/login");
  }
  return user;
});

/** リダイレクトせず null を許容したい箇所(公開ページ等)向け。 */
export const getOptionalSession = cache(loadSessionUser);

export async function requirePermission(flag: PermissionFlag) {
  const user = await verifySession();
  if (!hasPermission(user.role.permissions, flag)) {
    throw new Error("この操作を行う権限がありません。");
  }
  return user;
}

export async function requireRoleLevel(minLevel: number) {
  const user = await verifySession();
  if (user.role.level < minLevel) {
    throw new Error("この操作を行う権限がありません。");
  }
  return user;
}
