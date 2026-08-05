import "server-only";
import { prisma } from "@/lib/prisma";
import { deleteObject } from "@/lib/storage";

/** リソース削除時に、紐づく添付ファイルをオブジェクトストレージ・DB両方から削除する。 */
export async function deleteAttachmentsForResource(resourceType: string, resourceId: string) {
  const attachments = await prisma.attachment.findMany({ where: { resourceType, resourceId } });
  await Promise.all(attachments.map((a) => deleteObject(a.key).catch(() => undefined)));
  await prisma.attachment.deleteMany({ where: { resourceType, resourceId } });
}
