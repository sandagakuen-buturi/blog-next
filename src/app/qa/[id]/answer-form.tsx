"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { createAnswer } from "../actions";

export function AnswerForm({ questionId }: { questionId: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <form
      action={(formData) =>
        startTransition(async () => {
          try {
            await createAnswer(formData);
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "回答に失敗しました。");
          }
        })
      }
      className="flex flex-col gap-2"
    >
      <input type="hidden" name="questionId" value={questionId} />
      <Textarea name="body" required rows={5} placeholder="回答を書く" />
      <Button type="submit" disabled={isPending} className="w-fit">
        回答する
      </Button>
    </form>
  );
}
