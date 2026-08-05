import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/dal";
import { PERMISSIONS } from "@/lib/permissions";
import { buildObjectKey, createPresignedUploadUrl } from "@/lib/storage";

const ALLOWED_CONTENT_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "application/pdf",
]);
const MAX_FILE_NAME_LENGTH = 200;

const requestSchema = z.object({
  resourceType: z.enum(["BLOG_POST", "APPLICATION"]),
  resourceId: z.string().min(1),
  fileName: z.string().trim().min(1).max(MAX_FILE_NAME_LENGTH),
  contentType: z.enum(Array.from(ALLOWED_CONTENT_TYPES) as [string, ...string[]]),
});

/**
 * アップロード先リソースに対して、この人がファイルを添付できるかを確認する。
 * Server Actionと同様、クライアントの申告(resourceId)を信頼せず必ずDBで検証する。
 */
async function assertCanAttach(
  user: { id: string; role: { permissions: bigint } },
  resourceType: string,
  resourceId: string,
) {
  if (resourceType === "BLOG_POST") {
    const post = await prisma.blogPost.findUnique({ where: { id: resourceId } });
    if (!post) throw new Error("記事が見つかりません。");
    const canModerate = (user.role.permissions & PERMISSIONS.CAN_MODERATE_BLOG) !== 0n;
    if (post.authorId !== user.id && !canModerate) {
      throw new Error("この記事に添付する権限がありません。");
    }
    return;
  }

  const application = await prisma.application.findUnique({ where: { id: resourceId } });
  if (!application) throw new Error("申請が見つかりません。");
  if (application.applicantId !== user.id) {
    throw new Error("この申請に添付する権限がありません。");
  }
}

export async function POST(request: Request) {
  const user = await verifySession();

  const body = await request.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "リクエストが不正です。" }, { status: 400 });
  }

  try {
    await assertCanAttach(user, parsed.data.resourceType, parsed.data.resourceId);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "権限がありません。" },
      { status: 403 },
    );
  }

  const key = buildObjectKey(parsed.data.resourceType, parsed.data.resourceId, parsed.data.fileName);
  const uploadUrl = await createPresignedUploadUrl(key, parsed.data.contentType);

  const attachment = await prisma.attachment.create({
    data: {
      key,
      resourceType: parsed.data.resourceType,
      resourceId: parsed.data.resourceId,
      fileName: parsed.data.fileName,
      contentType: parsed.data.contentType,
      uploaderId: user.id,
    },
  });

  return NextResponse.json({ attachmentId: attachment.id, uploadUrl });
}
