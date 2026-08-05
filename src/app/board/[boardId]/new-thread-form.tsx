"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createThread } from "../actions";

export function NewThreadForm({ boardId }: { boardId: string }) {
  const [state, formAction, isPending] = useActionState(createThread, {});

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="boardId" value={boardId} />
      {state.error && (
        <p role="alert" className="text-destructive text-sm">
          {state.error}
        </p>
      )}
      <div className="flex flex-col gap-2">
        <Label htmlFor="title">スレッドタイトル</Label>
        <Input id="title" name="title" required maxLength={200} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="body">本文(最初のレス)</Label>
        <Textarea id="body" name="body" required rows={5} />
      </div>
      <Button type="submit" disabled={isPending} className="w-fit">
        スレッドを立てる
      </Button>
    </form>
  );
}
