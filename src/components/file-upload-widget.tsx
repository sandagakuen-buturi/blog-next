"use client";

import { useRef } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAttachmentUpload, type UploadResourceType } from "@/hooks/use-attachment-upload";

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

export function FileUploadWidget({
  resourceType,
  resourceId,
}: {
  resourceType: UploadResourceType;
  resourceId: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const upload = useAttachmentUpload({ resourceType, resourceId });

  function handleUpload(file: File) {
    if (file.size > MAX_FILE_SIZE_BYTES) {
      toast.error("ファイルサイズは10MBまでです。");
      return;
    }

    upload.mutate(file, {
      onSuccess: () => {
        toast.success("添付しました。");
        if (inputRef.current) inputRef.current.value = "";
      },
      onError: (error) => {
        toast.error(error instanceof Error ? error.message : "添付に失敗しました。");
      },
    });
  }

  return (
    <div className="flex items-center gap-2">
      <Input
        ref={inputRef}
        type="file"
        disabled={upload.isPending}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleUpload(file);
        }}
        className="max-w-64"
      />
      {upload.isPending && (
        <Button type="button" variant="ghost" disabled>
          アップロード中...
        </Button>
      )}
    </div>
  );
}
