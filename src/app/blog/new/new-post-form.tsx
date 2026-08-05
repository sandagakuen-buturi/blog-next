"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createBlogPost } from "../actions";

const VISIBILITY_LABELS: Record<string, string> = {
  PUBLIC_STUDENT: "全体公開(学生ロール以上全員)",
  DEPARTMENT_ONLY: "所属課のみ",
  MEMBERS_ONLY: "物理部員のみ(学生を除く)",
  SPECIFIC_ROLE: "特定ロール",
  SPECIFIC_USERS: "個別ユーザー指名",
};

type RoleOption = { id: string; name: string };

export function NewPostForm({
  department,
  roles,
}: {
  department: "IT" | "ROBOT" | "HYBRID" | null;
  roles: RoleOption[];
}) {
  const [visibilityScope, setVisibilityScope] = useState("PUBLIC_STUDENT");
  const [state, formAction, isPending] = useActionState(createBlogPost, {});

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

      {department === "HYBRID" && (
        <div className="flex flex-col gap-2">
          <Label htmlFor="targetDepartment">投稿先の課</Label>
          <Select name="targetDepartment" required>
            <SelectTrigger id="targetDepartment">
              <SelectValue placeholder="選択してください" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="IT">IT課</SelectItem>
              <SelectItem value="ROBOT">ロボット課</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <Label htmlFor="bodyMarkdown">本文(Markdown)</Label>
        <Textarea id="bodyMarkdown" name="bodyMarkdown" required rows={12} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="publishedAt">公開日時(空欄なら即時公開、未来日時なら予約投稿)</Label>
        <Input id="publishedAt" name="publishedAt" type="datetime-local" />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="visibilityScope">公開範囲</Label>
        <Select
          name="visibilityScope"
          value={visibilityScope}
          onValueChange={(value) => value && setVisibilityScope(value)}
        >
          <SelectTrigger id="visibilityScope">
            <SelectValue>{(value: string) => VISIBILITY_LABELS[value] ?? value}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {Object.entries(VISIBILITY_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {visibilityScope === "SPECIFIC_ROLE" && (
        <div className="flex flex-col gap-2">
          <Label htmlFor="targetRoleId">閲覧を許可するロール</Label>
          <Select name="targetRoleId" required>
            <SelectTrigger id="targetRoleId">
              <SelectValue placeholder="選択してください" />
            </SelectTrigger>
            <SelectContent>
              {roles.map((role) => (
                <SelectItem key={role.id} value={role.id}>
                  {role.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {visibilityScope === "SPECIFIC_USERS" && (
        <div className="flex flex-col gap-2">
          <Label htmlFor="targetUserIds">閲覧を許可するユーザーID(カンマ区切り)</Label>
          <Input id="targetUserIds" name="targetUserIds" required />
        </div>
      )}

      <Button type="submit" disabled={isPending} className="w-fit">
        投稿する
      </Button>
    </form>
  );
}
