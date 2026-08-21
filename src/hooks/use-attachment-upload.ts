"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  attachmentKeys,
  uploadAttachment,
  type UploadResourceType,
} from "@/lib/uploads-client";

export type { UploadResourceType };

export function useAttachmentUpload({
  resourceType,
  resourceId,
}: {
  resourceType: UploadResourceType;
  resourceId: string;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [...attachmentKeys.byResource(resourceType, resourceId), "upload"],
    mutationFn: (file: File) => uploadAttachment({ resourceType, resourceId, file }),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: attachmentKeys.byResource(resourceType, resourceId),
      });
    },
  });
}
