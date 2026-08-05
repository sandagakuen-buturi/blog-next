import { prisma } from "@/lib/prisma";

const IMAGE_CONTENT_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);

export async function AttachmentList({
  resourceType,
  resourceId,
}: {
  resourceType: string;
  resourceId: string;
}) {
  const attachments = await prisma.attachment.findMany({
    where: { resourceType, resourceId },
    orderBy: { createdAt: "asc" },
  });

  if (attachments.length === 0) return null;

  return (
    <ul className="flex flex-wrap gap-3">
      {attachments.map((attachment) => (
        <li key={attachment.id}>
          {IMAGE_CONTENT_TYPES.has(attachment.contentType) ? (
            // eslint-disable-next-line @next/next/no-img-element -- 署名付きURLへのリダイレクトなのでnext/imageの最適化対象外
            <img
              src={`/api/uploads/${attachment.id}`}
              alt={attachment.fileName}
              className="h-32 w-32 rounded-md border object-cover"
            />
          ) : (
            <a
              href={`/api/uploads/${attachment.id}`}
              className="text-sm hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              📎 {attachment.fileName}
            </a>
          )}
        </li>
      ))}
    </ul>
  );
}
