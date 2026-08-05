"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { FieldDef } from "@/lib/application-fields";
import { resubmitApplication } from "../actions";

export function ResubmitForm({
  applicationId,
  fields,
  data,
}: {
  applicationId: string;
  fields: FieldDef[];
  data: Record<string, unknown>;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <form
      action={(formData) =>
        startTransition(async () => {
          formData.set("applicationId", applicationId);
          try {
            await resubmitApplication(formData);
            toast.success("再提出しました。");
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "再提出に失敗しました。");
          }
        })
      }
      className="flex flex-col gap-4 rounded-lg border p-4"
    >
      <h2 className="text-lg font-semibold">内容を修正して再提出</h2>
      {fields.map((field) => (
        <div key={field.key} className="flex flex-col gap-2">
          <Label htmlFor={`resubmit-${field.key}`}>{field.label}</Label>
          {field.type === "textarea" ? (
            <Textarea
              id={`resubmit-${field.key}`}
              name={field.key}
              required={field.required}
              defaultValue={String(data[field.key] ?? "")}
              rows={4}
            />
          ) : (
            <Input
              id={`resubmit-${field.key}`}
              name={field.key}
              type={field.type === "number" ? "number" : field.type === "date" ? "date" : "text"}
              required={field.required}
              defaultValue={String(data[field.key] ?? "")}
            />
          )}
        </div>
      ))}
      <Button type="submit" disabled={isPending} className="w-fit">
        再提出する
      </Button>
    </form>
  );
}
