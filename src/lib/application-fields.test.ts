import { describe, expect, it } from "vitest";
import { buildDataSchema, type FieldDef } from "./application-fields";

describe("buildDataSchema", () => {
  it("rejects a missing required text field", () => {
    const fields: FieldDef[] = [{ key: "reason", label: "申請理由", type: "textarea", required: true }];
    const schema = buildDataSchema(fields);
    expect(schema.safeParse({ reason: "" }).success).toBe(false);
    expect(schema.safeParse({}).success).toBe(false);
  });

  it("accepts an optional field left blank", () => {
    const fields: FieldDef[] = [{ key: "note", label: "備考", type: "text", required: false }];
    const schema = buildDataSchema(fields);
    expect(schema.safeParse({}).success).toBe(true);
  });

  it("coerces a number field and rejects non-numeric input", () => {
    const fields: FieldDef[] = [{ key: "amount", label: "金額", type: "number", required: true }];
    const schema = buildDataSchema(fields);
    const ok = schema.safeParse({ amount: "1500" });
    expect(ok.success).toBe(true);
    if (ok.success) expect(ok.data.amount).toBe(1500);
    expect(schema.safeParse({ amount: "not-a-number" }).success).toBe(false);
  });

  it("validates multiple fields independently", () => {
    const fields: FieldDef[] = [
      { key: "item", label: "品名", type: "text", required: true },
      { key: "quantity", label: "数量", type: "number", required: true },
    ];
    const schema = buildDataSchema(fields);
    expect(schema.safeParse({ item: "プリンター用紙", quantity: "3" }).success).toBe(true);
    expect(schema.safeParse({ item: "", quantity: "3" }).success).toBe(false);
  });
});
