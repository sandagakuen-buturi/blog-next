"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { createPost } from "../../actions";

export function ReplyForm({ boardId, threadId }: { boardId: string; threadId: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <form
      action={(formData) =>
        startTransition(async () => {
          try {
            await createPost(formData);
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "投稿に失敗しました。");
          }
        })
      }
      className="flex flex-col gap-2"
    >
      <input type="hidden" name="boardId" value={boardId} />
      <input type="hidden" name="threadId" value={threadId} />
      <Textarea name="body" required rows={3} placeholder="レスを書く" />
      <Button type="submit" disabled={isPending} className="w-fit">
        投稿する
      </Button>
    </form>
  );
}
