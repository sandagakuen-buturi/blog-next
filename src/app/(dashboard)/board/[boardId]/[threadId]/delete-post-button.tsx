"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { deletePost } from "../../actions";

export function DeletePostButton({
  postId,
  boardId,
  threadId,
}: {
  postId: string;
  boardId: string;
  threadId: string;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      disabled={isPending}
      onClick={() => {
        if (!window.confirm("このレスを削除しますか?")) return;
        startTransition(async () => {
          const formData = new FormData();
          formData.set("postId", postId);
          formData.set("boardId", boardId);
          formData.set("threadId", threadId);
          try {
            await deletePost(formData);
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "削除に失敗しました。");
          }
        });
      }}
    >
      削除
    </Button>
  );
}
