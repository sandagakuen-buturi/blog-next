"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { deleteAnswer } from "../actions";

export function DeleteAnswerButton({
  answerId,
  questionId,
}: {
  answerId: string;
  questionId: string;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      disabled={isPending}
      onClick={() => {
        if (!window.confirm("この回答を削除しますか?")) return;
        startTransition(async () => {
          const formData = new FormData();
          formData.set("answerId", answerId);
          formData.set("questionId", questionId);
          try {
            await deleteAnswer(formData);
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
