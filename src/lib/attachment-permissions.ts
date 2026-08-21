import "server-only";

import { resolveApprovers } from "@/lib/approval";
import { PERMISSIONS } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { canView } from "@/lib/visibility";

export async function canViewAttachment(
  user: Parameters<typeof canView>[0] & { role: { permissions: bigint } },
  resourceType: string,
  resourceId: string,
): Promise<boolean> {
  if (resourceType === "BLOG_POST") {
    return canView(user, "BLOG_POST", resourceId);
  }

  // APPLICATION: 申請者本人・いずれかの承認段階の承認者・テンプレート管理者のみ閲覧可。
  const application = await prisma.application.findUnique({
    where: { id: resourceId },
    include: { template: { include: { steps: true } } },
  });
  if (!application) return false;
  if (application.applicantId === user.id) return true;
  if ((user.role.permissions & PERMISSIONS.CAN_MANAGE_APPLICATION_TEMPLATES) !== 0n) return true;

  const approverLists = await Promise.all(application.template.steps.map(resolveApprovers));
  return approverLists.some((approvers) => approvers.some((a) => a.id === user.id));
}
