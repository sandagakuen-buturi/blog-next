"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FIELD_TYPES, type FieldDef } from "@/lib/application-fields";
import { createApplicationTemplate } from "./actions";

type RoleOption = { id: string; name: string };

type StepRow =
  | { approverType: "SPECIFIC_ROLE"; approverRoleId: string }
  | { approverType: "SPECIFIC_USERS"; approverUserIds: string };

const FIELD_TYPE_LABELS: Record<string, string> = {
  text: "1行テキスト",
  textarea: "複数行テキスト",
  number: "数値",
  date: "日付",
};

export function TemplateForm({ roles }: { roles: RoleOption[] }) {
  const [fields, setFields] = useState<FieldDef[]>([
    { key: "reason", label: "申請理由", type: "textarea", required: true },
  ]);
  const [steps, setSteps] = useState<StepRow[]>([
    { approverType: "SPECIFIC_ROLE", approverRoleId: roles[0]?.id ?? "" },
  ]);
  const [isPending, startTransition] = useTransition();

  return (
    <form
      action={(formData) => {
        formData.set("fieldsJson", JSON.stringify(fields));
        formData.set(
          "stepsJson",
          JSON.stringify(
            steps.map((s) =>
              s.approverType === "SPECIFIC_ROLE"
                ? { approverType: "SPECIFIC_ROLE", approverRoleId: s.approverRoleId }
                : {
                    approverType: "SPECIFIC_USERS",
                    approverUserIds: s.approverUserIds.split(",").map((v) => v.trim()).filter(Boolean),
                  },
            ),
          ),
        );
        startTransition(async () => {
          try {
            await createApplicationTemplate(formData);
            toast.success("申請テンプレートを作成しました。");
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "作成に失敗しました。");
          }
        });
      }}
      className="flex flex-col gap-6 rounded-lg border p-4"
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor="name">テンプレート名(例: 物品申請、ロール昇格申請)</Label>
        <Input id="name" name="name" required maxLength={100} />
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <Label>入力項目</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              setFields((prev) => [...prev, { key: "", label: "", type: "text", required: true }])
            }
          >
            項目を追加
          </Button>
        </div>
        {fields.map((field, index) => (
          <div key={index} className="flex flex-wrap items-center gap-2 rounded-md border p-2">
            <Input
              placeholder="項目キー(英数字)"
              value={field.key}
              onChange={(e) =>
                setFields((prev) =>
                  prev.map((f, i) => (i === index ? { ...f, key: e.target.value } : f)),
                )
              }
              className="w-40"
            />
            <Input
              placeholder="表示ラベル"
              value={field.label}
              onChange={(e) =>
                setFields((prev) =>
                  prev.map((f, i) => (i === index ? { ...f, label: e.target.value } : f)),
                )
              }
              className="w-40"
            />
            <Select
              value={field.type}
              onValueChange={(value) =>
                value &&
                setFields((prev) =>
                  prev.map((f, i) =>
                    i === index ? { ...f, type: value as FieldDef["type"] } : f,
                  ),
                )
              }
            >
              <SelectTrigger className="w-36">
                <SelectValue>{(v: string) => FIELD_TYPE_LABELS[v] ?? v}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {FIELD_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {FIELD_TYPE_LABELS[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <label className="flex items-center gap-1.5 text-sm">
              <Checkbox
                checked={field.required}
                onCheckedChange={(checked) =>
                  setFields((prev) =>
                    prev.map((f, i) => (i === index ? { ...f, required: checked === true } : f)),
                  )
                }
              />
              必須
            </label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setFields((prev) => prev.filter((_, i) => i !== index))}
            >
              削除
            </Button>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <Label>承認フロー(段階順)</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              setSteps((prev) => [
                ...prev,
                { approverType: "SPECIFIC_ROLE", approverRoleId: roles[0]?.id ?? "" },
              ])
            }
          >
            段階を追加
          </Button>
        </div>
        {steps.map((step, index) => (
          <div key={index} className="flex flex-wrap items-center gap-2 rounded-md border p-2">
            <span className="text-muted-foreground text-sm">第{index + 1}段階</span>
            <Select
              value={step.approverType}
              onValueChange={(value) =>
                value &&
                setSteps((prev) =>
                  prev.map((s, i) =>
                    i === index
                      ? value === "SPECIFIC_ROLE"
                        ? { approverType: "SPECIFIC_ROLE", approverRoleId: roles[0]?.id ?? "" }
                        : { approverType: "SPECIFIC_USERS", approverUserIds: "" }
                      : s,
                  ),
                )
              }
            >
              <SelectTrigger className="w-44">
                <SelectValue>
                  {(v: string) => (v === "SPECIFIC_ROLE" ? "特定ロール" : "個別ユーザー指名")}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SPECIFIC_ROLE">特定ロール</SelectItem>
                <SelectItem value="SPECIFIC_USERS">個別ユーザー指名</SelectItem>
              </SelectContent>
            </Select>
            {step.approverType === "SPECIFIC_ROLE" ? (
              <Select
                value={step.approverRoleId}
                onValueChange={(value) =>
                  value &&
                  setSteps((prev) =>
                    prev.map((s, i) =>
                      i === index && s.approverType === "SPECIFIC_ROLE"
                        ? { ...s, approverRoleId: value }
                        : s,
                    ),
                  )
                }
              >
                <SelectTrigger className="w-44">
                  <SelectValue>
                    {(v: string) => roles.find((r) => r.id === v)?.name ?? "ロールを選択"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                placeholder="承認者のユーザーID(カンマ区切り)"
                value={step.approverUserIds}
                onChange={(e) =>
                  setSteps((prev) =>
                    prev.map((s, i) =>
                      i === index && s.approverType === "SPECIFIC_USERS"
                        ? { ...s, approverUserIds: e.target.value }
                        : s,
                    ),
                  )
                }
                className="w-56"
              />
            )}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setSteps((prev) => prev.filter((_, i) => i !== index))}
            >
              削除
            </Button>
          </div>
        ))}
      </div>

      <Button type="submit" disabled={isPending} className="w-fit">
        テンプレートを作成
      </Button>
    </form>
  );
}
