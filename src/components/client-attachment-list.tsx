"use client";

import { useAttachments, type AttachmentResourceType } from "@/hooks/use-attachments";
import type { AttachmentItem } from "@/lib/uploads-client";

const IMAGE_CONTENT_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);

export function ClientAttachmentList({
  resourceType,
  resourceId,
  initialAttachments,
}: {
  resourceType: AttachmentResourceType;
  resourceId: string;
  initialAttachments?: AttachmentItem[];
}) {
  const { data, error, isLoading } = useAttachments({
    resourceType,
    resourceId,
    initialAttachments,
  });

  if (isLoading) {
    return <p className="text-muted-foreground text-sm">添付ファイルを読み込み中...</p>;
  }

  if (error) {
    return (
      <p className="text-destructive text-sm">
        {error instanceof Error ? error.message : "添付ファイルの取得に失敗しました。"}
      </p>
    );
  }

  if (!data || data.length === 0) return null;

  return (
    <ul className="flex flex-wrap gap-3">
      {data.map((attachment) => (
        <li key={attachment.id}>
          {IMAGE_CONTENT_TYPES.has(attachment.contentType) ? (
            // eslint-disable-next-line @next/next/no-img-element -- 署名付きURLへのリダイレクトなのでnext/imageの最適化対象外
            <img
              src={attachment.url}
              alt={attachment.fileName}
              className="h-32 w-32 rounded-md border object-cover"
            />
          ) : (
            <a
              href={attachment.url}
              className="text-sm hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              添付: {attachment.fileName}
            </a>
          )}
        </li>
      ))}
    </ul>
  );
}
