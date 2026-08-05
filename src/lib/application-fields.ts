import { z } from "zod";

export const FIELD_TYPES = ["text", "textarea", "number", "date"] as const;

export const fieldDefSchema = z.object({
  key: z.string().trim().min(1),
  label: z.string().trim().min(1),
  type: z.enum(FIELD_TYPES),
  required: z.boolean(),
});
export type FieldDef = z.infer<typeof fieldDefSchema>;

export const stepDefSchema = z.discriminatedUnion("approverType", [
  z.object({ approverType: z.literal("SPECIFIC_ROLE"), approverRoleId: z.string().min(1) }),
  z.object({
    approverType: z.literal("SPECIFIC_USERS"),
    approverUserIds: z.array(z.string().min(1)).min(1),
  }),
]);
export type StepDef = z.infer<typeof stepDefSchema>;

/** テンプレートの fields(Json) を実際の入力値に対して検証する動的zodスキーマを組み立てる。 */
export function buildDataSchema(fields: FieldDef[]) {
  const shape: Record<string, z.ZodTypeAny> = {};
  for (const field of fields) {
    let schema: z.ZodTypeAny =
      field.type === "number" ? z.coerce.number() : z.string().trim();
    if (!field.required) schema = schema.optional();
    else if (field.type !== "number") schema = (schema as z.ZodString).min(1, `${field.label}は必須です。`);
    shape[field.key] = schema;
  }
  return z.object(shape);
}
