"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { sendBulkEmailAction } from "./actions";

type Role = { id: string; name: string };

const DEPARTMENT_LABELS: Record<string, string> = {
  IT: "IT課",
  ROBOT: "ロボット課",
  HYBRID: "ハイブリッド",
};

export function BulkEmailForm({ roles }: { roles: Role[] }) {
  const [state, formAction, isPending] = useActionState(sendBulkEmailAction, {});

  useEffect(() => {
    if (state.success) toast.success(state.success);
  }, [state.success]);

  return (
    <form action={formAction} className="flex flex-col gap-4 rounded-lg border p-4">
      {state.error && (
        <p role="alert" className="text-destructive text-sm">
          {state.error}
        </p>
      )}

      <div className="flex flex-col gap-2">
        <Label>送信対象ロール</Label>
        <div className="grid grid-cols-2 gap-2">
          {roles.map((role) => (
            <label key={role.id} className="flex items-center gap-2 text-sm">
              <Checkbox name="roleIds" value={role.id} />
              {role.name}
            </label>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label>送信対象の課</Label>
        <div className="flex gap-4">
          {Object.entries(DEPARTMENT_LABELS).map(([value, label]) => (
            <label key={value} className="flex items-center gap-2 text-sm">
              <Checkbox name="departments" value={value} />
              {label}
            </label>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="individualUserIds">個別ユーザーID(カンマ区切り、任意)</Label>
        <Input id="individualUserIds" name="individualUserIds" />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="subject">件名</Label>
        <Input id="subject" name="subject" required maxLength={200} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="body">本文</Label>
        <Textarea id="body" name="body" required rows={8} />
      </div>

      <Button type="submit" disabled={isPending} className="w-fit">
        送信する
      </Button>
    </form>
  );
}
