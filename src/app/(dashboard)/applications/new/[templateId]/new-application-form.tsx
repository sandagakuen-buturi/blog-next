"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { FieldDef } from "@/lib/application-fields";
import { createApplication } from "../../actions";

export function NewApplicationForm({
  templateId,
  fields,
}: {
  templateId: string;
  fields: FieldDef[];
}) {
  const [state, formAction, isPending] = useActionState(createApplication, {});

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="templateId" value={templateId} />

      {state.error && (
        <p role="alert" className="text-destructive text-sm">
          {state.error}
        </p>
      )}

      {fields.map((field) => (
        <div key={field.key} className="flex flex-col gap-2">
          <Label htmlFor={field.key}>
            {field.label}
            {field.required && <span className="text-destructive"> *</span>}
          </Label>
          {field.type === "textarea" ? (
            <Textarea id={field.key} name={field.key} required={field.required} rows={4} />
          ) : (
            <Input
              id={field.key}
              name={field.key}
              type={field.type === "number" ? "number" : field.type === "date" ? "date" : "text"}
              required={field.required}
            />
          )}
        </div>
      ))}

      <Button type="submit" disabled={isPending} className="w-fit">
        申請する
      </Button>
    </form>
  );
}
