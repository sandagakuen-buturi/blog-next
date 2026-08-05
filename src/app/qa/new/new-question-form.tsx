"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createQuestion } from "../actions";

export function NewQuestionForm() {
  const [state, formAction, isPending] = useActionState(createQuestion, {});

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state.error && (
        <p role="alert" className="text-destructive text-sm">
          {state.error}
        </p>
      )}
      <div className="flex flex-col gap-2">
        <Label htmlFor="title">タイトル</Label>
        <Input id="title" name="title" required maxLength={200} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="body">質問内容</Label>
        <Textarea id="body" name="body" required rows={8} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="tags">タグ(カンマ区切り、例: IT課,Python)</Label>
        <Input id="tags" name="tags" />
      </div>
      <Button type="submit" disabled={isPending} className="w-fit">
        質問する
      </Button>
    </form>
  );
}
