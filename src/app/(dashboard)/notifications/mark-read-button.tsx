"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { markNotificationRead } from "./actions";

export function MarkReadButton({ notificationId }: { notificationId: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          const formData = new FormData();
          formData.set("notificationId", notificationId);
          await markNotificationRead(formData);
        })
      }
    >
      既読にする
    </Button>
  );
}
