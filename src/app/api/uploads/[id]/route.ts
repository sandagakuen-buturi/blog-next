import { NextResponse } from "next/server";
import { canViewAttachment } from "@/lib/attachment-permissions";
import { verifySession } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { getCachedPresignedDownloadUrl } from "@/lib/storage";

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

  const url = await getCachedPresignedDownloadUrl(attachment.key);
  return NextResponse.redirect(url);
}
