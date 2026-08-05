import "server-only";
import { prisma } from "@/lib/prisma";
import { ROLE_LEVELS } from "@/lib/permissions";
import type { ApproverType } from "@/generated/prisma/client";

type Step = {
  approverType: ApproverType;
  approverRoleId: string | null;
  approverUserIds: string[];
};

/** 指定ステップの承認候補ユーザーを解決する。 */
export async function resolveApprovers(step: Step) {
  if (step.approverType === "SPECIFIC_ROLE") {
    if (!step.approverRoleId) return [];
    return prisma.user.findMany({ where: { roleId: step.approverRoleId } });
  }
  if (step.approverUserIds.length === 0) return [];
  return prisma.user.findMany({ where: { id: { in: step.approverUserIds } } });
}

/** 承認候補が誰もいない場合に通知するシステム管理者を解決する。 */
export async function resolveSystemAdmins() {
  return prisma.user.findMany({ where: { role: { level: { gte: ROLE_LEVELS.SYSTEM_ADMIN } } } });
}
