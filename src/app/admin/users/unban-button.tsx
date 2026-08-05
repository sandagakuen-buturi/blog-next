"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { unbanBoardUser } from "@/app/board/actions";

export function UnbanButton({ userId }: { userId: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          const formData = new FormData();
          formData.set("userId", userId);
          try {
            await unbanBoardUser(formData);
            toast.success("BANを解除しました。");
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "処理に失敗しました。");
          }
        })
      }
    >
      解除
    </Button>
  );
}
