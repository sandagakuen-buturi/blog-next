"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { setDiscordWebhook } from "./actions";

export function WebhookForm({
  scope,
  label,
  isConfigured,
}: {
  scope: "IT" | "ROBOT" | "HYBRID" | "SYSTEM";
  label: string;
  isConfigured: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <form
      action={(formData) =>
        startTransition(async () => {
          try {
            await setDiscordWebhook(formData);
            toast.success(`${label}のWebhookを更新しました。`);
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "更新に失敗しました。");
          }
        })
      }
      className="flex flex-col gap-2"
    >
      <input type="hidden" name="scope" value={scope} />
      <div className="flex items-center gap-2">
        <Label htmlFor={`webhook-${scope}`}>{label}</Label>
        <Badge variant={isConfigured ? "secondary" : "outline"}>
          {isConfigured ? "設定済み" : "未設定"}
        </Badge>
      </div>
      <div className="flex gap-2">
        <Input
          id={`webhook-${scope}`}
          name="url"
          type="url"
          placeholder="https://discord.com/api/webhooks/..."
          required
        />
        <Button type="submit" disabled={isPending}>
          保存
        </Button>
      </div>
    </form>
  );
}
