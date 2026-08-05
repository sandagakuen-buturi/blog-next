"use client";

import { useRef, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { decideApplication } from "../actions";

export function DecisionForm({ applicationId }: { applicationId: string }) {
  const [isPending, startTransition] = useTransition();
  const commentRef = useRef<HTMLTextAreaElement>(null);

  function submit(decision: "APPROVE" | "REJECT" | "RETURN") {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("applicationId", applicationId);
      formData.set("decision", decision);
      formData.set("comment", commentRef.current?.value ?? "");
      try {
        await decideApplication(formData);
        toast.success("処理しました。");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "処理に失敗しました。");
      }
    });
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border p-4">
      <Label htmlFor="comment">コメント(任意、却下・差し戻し時は理由を記載してください)</Label>
      <Textarea id="comment" ref={commentRef} rows={3} />
      <div className="flex gap-2">
        <Button type="button" disabled={isPending} onClick={() => submit("APPROVE")}>
          承認
        </Button>
        <Button type="button" variant="outline" disabled={isPending} onClick={() => submit("RETURN")}>
          差し戻す
        </Button>
        <Button type="button" variant="destructive" disabled={isPending} onClick={() => submit("REJECT")}>
          却下
        </Button>
      </div>
    </div>
  );
}
