import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/dal";
import { canView } from "@/lib/visibility";
import { resolveApprovers } from "@/lib/approval";
import { PERMISSIONS } from "@/lib/permissions";
import { createPresignedDownloadUrl } from "@/lib/storage";

async function canViewAttachment(
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

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await verifySession();
  const { id } = await params;

  const attachment = await prisma.attachment.findUnique({ where: { id } });
  if (!attachment) {
    return NextResponse.json({ error: "見つかりません。" }, { status: 404 });
  }

  const allowed = await canViewAttachment(user, attachment.resourceType, attachment.resourceId);
  if (!allowed) {
    return NextResponse.json({ error: "この添付ファイルを閲覧する権限がありません。" }, { status: 403 });
  }

  const url = await createPresignedDownloadUrl(attachment.key);
  return NextResponse.redirect(url);
}
