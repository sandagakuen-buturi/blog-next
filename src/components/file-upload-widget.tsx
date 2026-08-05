"use client";

import { useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

export function FileUploadWidget({
  resourceType,
  resourceId,
}: {
  resourceType: "BLOG_POST" | "APPLICATION";
  resourceId: string;
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  function handleUpload(file: File) {
    if (file.size > MAX_FILE_SIZE_BYTES) {
      toast.error("ファイルサイズは10MBまでです。");
      return;
    }

    startTransition(async () => {
      try {
        const res = await fetch("/api/uploads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            resourceType,
            resourceId,
            fileName: file.name,
            contentType: file.type,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "アップロードURLの取得に失敗しました。");

        const putRes = await fetch(data.uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": file.type },
          body: file,
        });
        if (!putRes.ok) throw new Error("ファイルのアップロードに失敗しました。");

        toast.success("添付しました。");
        if (inputRef.current) inputRef.current.value = "";
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "添付に失敗しました。");
      }
    });
  }

  return (
    <div className="flex items-center gap-2">
      <Input
        ref={inputRef}
        type="file"
        disabled={isPending}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleUpload(file);
        }}
        className="max-w-64"
      />
      {isPending && (
        <Button type="button" variant="ghost" disabled>
          アップロード中...
        </Button>
      )}
    </div>
  );
}
