"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { PERMISSIONS } from "@/lib/permissions";
import { createCustomRole } from "./actions";

const PERMISSION_LABELS: Record<keyof typeof PERMISSIONS, string> = {
  CAN_POST_BLOG: "ブログ投稿",
  CAN_MODERATE_BLOG: "ブログの他人のコメント削除",
  CAN_ASK_QA: "QA質問投稿",
  CAN_ANSWER_QA: "QA回答投稿",
  CAN_CREATE_BOARD: "掲示板の板作成",
  CAN_SEND_BULK_EMAIL: "一括メール送信",
  CAN_MANAGE_ROLES: "ロール管理",
  CAN_MANAGE_WEBHOOKS: "Discord Webhook設定",
  CAN_VIEW_AUDIT_LOG: "監査ログ閲覧",
  CAN_BAN_BOARD_USER: "掲示板BAN",
  CAN_MANAGE_APPLICATION_TEMPLATES: "申請テンプレート管理",
};

export function CreateRoleForm() {
  const [isPending, startTransition] = useTransition();

  return (
    <form
      action={(formData) =>
        startTransition(async () => {
          try {
            await createCustomRole(formData);
            toast.success("カスタムロールを作成しました。");
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "作成に失敗しました。");
          }
        })
      }
      className="flex flex-col gap-4"
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor="name">ロール名</Label>
        <Input id="name" name="name" required maxLength={50} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="level">階層レベル(1〜89、学生=0・システム管理者=90は予約済み)</Label>
        <Input id="level" name="level" type="number" min={1} max={89} required />
      </div>

      <div className="flex flex-col gap-2">
        <Label>権限</Label>
        <div className="grid grid-cols-2 gap-2">
          {(Object.keys(PERMISSIONS) as (keyof typeof PERMISSIONS)[]).map((key) => (
            <label key={key} className="flex items-center gap-2 text-sm">
              <Checkbox name="permissionKeys" value={key} />
              {PERMISSION_LABELS[key]}
            </label>
          ))}
        </div>
      </div>

      <Button type="submit" disabled={isPending} className="w-fit">
        作成
      </Button>
    </form>
  );
}
