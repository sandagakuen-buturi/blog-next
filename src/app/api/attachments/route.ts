import { NextResponse } from "next/server";
import { z } from "zod";
import { canViewAttachment } from "@/lib/attachment-permissions";
import { verifySession } from "@/lib/dal";
import { prisma } from "@/lib/prisma";

const searchParamsSchema = z.object({
  resourceType: z.enum(["BLOG_POST", "APPLICATION"]),
  resourceId: z.string().min(1),
});

export async function GET(request: Request) {
  const user = await verifySession();
  const url = new URL(request.url);
  const parsed = searchParamsSchema.safeParse({
    resourceType: url.searchParams.get("resourceType"),
    resourceId: url.searchParams.get("resourceId"),
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "リクエストが不正です。" }, { status: 400 });
  }

  const allowed = await canViewAttachment(
    user,
    parsed.data.resourceType,
    parsed.data.resourceId,
  );
  if (!allowed) {
    return NextResponse.json(
      { error: "添付ファイルを閲覧する権限がありません。" },
      { status: 403 },
    );
  }

  const attachments = await prisma.attachment.findMany({
    where: {
      resourceType: parsed.data.resourceType,
      resourceId: parsed.data.resourceId,
    },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      fileName: true,
      contentType: true,
      createdAt: true,
    },
  });

  return NextResponse.json({
    attachments: attachments.map((attachment) => ({
      ...attachment,
      createdAt: attachment.createdAt.toISOString(),
      url: `/api/uploads/${attachment.id}`,
    })),
  });
}
