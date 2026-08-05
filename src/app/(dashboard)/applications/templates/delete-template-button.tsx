"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { deleteApplicationTemplate } from "./actions";

export function DeleteTemplateButton({ templateId }: { templateId: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="destructive"
      size="sm"
      disabled={isPending}
      onClick={() => {
        if (!window.confirm("このテンプレートを削除しますか?")) return;
        startTransition(async () => {
          const formData = new FormData();
          formData.set("templateId", templateId);
          try {
            await deleteApplicationTemplate(formData);
            toast.success("削除しました。");
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
