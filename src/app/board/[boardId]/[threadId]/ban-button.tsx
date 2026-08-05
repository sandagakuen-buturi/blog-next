"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { banBoardUser } from "../../actions";

export function BanButton({ userId }: { userId: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="destructive"
      size="sm"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          const formData = new FormData();
          formData.set("userId", userId);
          try {
            await banBoardUser(formData);
            toast.success("BANしました。");
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "処理に失敗しました。");
          }
        })
      }
    >
      BAN
    </Button>
  );
}
