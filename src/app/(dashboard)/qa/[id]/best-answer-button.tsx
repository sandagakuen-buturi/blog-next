"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { markBestAnswer } from "../actions";

export function BestAnswerButton({
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
      variant="outline"
      size="sm"
      disabled={isPending}
      className="mt-2"
      onClick={() =>
        startTransition(async () => {
          const formData = new FormData();
          formData.set("answerId", answerId);
          formData.set("questionId", questionId);
          try {
            await markBestAnswer(formData);
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "設定に失敗しました。");
          }
        })
      }
    >
      ベストアンサーに選ぶ
    </Button>
  );
}
