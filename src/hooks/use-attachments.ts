"use client";

import { useQuery } from "@tanstack/react-query";
import {
  attachmentKeys,
  fetchAttachments,
  type AttachmentItem,
  type AttachmentResourceType,
} from "@/lib/uploads-client";

export type { AttachmentResourceType };

export function useAttachments({
  resourceType,
  resourceId,
  initialAttachments,
}: {
  resourceType: AttachmentResourceType;
  resourceId: string;
  initialAttachments?: AttachmentItem[];
}) {
  return useQuery({
    queryKey: attachmentKeys.byResource(resourceType, resourceId),
    queryFn: () => fetchAttachments({ resourceType, resourceId }),
    initialData: initialAttachments,
  });
}
