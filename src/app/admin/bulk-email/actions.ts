"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/dal";
import { sendBulkEmail } from "@/lib/mail";
import { recordAudit } from "@/lib/audit";
import { PERMISSIONS } from "@/lib/permissions";
import { enforceRateLimit } from "@/lib/ratelimit";

const sendSchema = z.object({
  roleIds: z.array(z.string()),
  departments: z.array(z.enum(["IT", "ROBOT", "HYBRID"])),
  individualUserIds: z.array(z.string()),
  subject: z.string().trim().min(1).max(200),
  body: z.string().trim().min(1),
});

export type SendBulkEmailState = { error?: string; success?: string };

export async function sendBulkEmailAction(
  _prevState: SendBulkEmailState,
  formData: FormData,
): Promise<SendBulkEmailState> {
  try {
    const actor = await requirePermission(PERMISSIONS.CAN_SEND_BULK_EMAIL);
    await enforceRateLimit("bulk-email", actor.id, 3, 600);

    const parsed = sendSchema.parse({
      roleIds: formData.getAll("roleIds"),
      departments: formData.getAll("departments"),
      individualUserIds: String(formData.get("individualUserIds") ?? "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      subject: formData.get("subject"),
      body: formData.get("body"),
    });

    const users = await prisma.user.findMany({
      where: {
        OR: [
          parsed.roleIds.length > 0 ? { roleId: { in: parsed.roleIds } } : undefined,
          parsed.departments.length > 0 ? { department: { in: parsed.departments } } : undefined,
          parsed.individualUserIds.length > 0 ? { id: { in: parsed.individualUserIds } } : undefined,
        ].filter((clause): clause is NonNullable<typeof clause> => clause !== undefined),
      },
    });

    if (users.length === 0) {
      return { error: "送信対象が0件です。ロール・課・個別ユーザーのいずれかを選択してください。" };
    }

    await sendBulkEmail(users.map((u) => u.email), parsed.subject, parsed.body);

    await prisma.emailAudit.create({
      data: {
        senderId: actor.id,
        recipients: users.map((u) => u.email),
        subject: parsed.subject,
      },
    });

    await recordAudit({
      actorId: actor.id,
      action: "BULK_EMAIL",
      targetType: "EmailAudit",
      after: { subject: parsed.subject, recipientCount: users.length },
    });

    return { success: `${users.length}件に送信しました。` };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.issues[0]?.message ?? "入力内容を確認してください。" };
    }
    if (error instanceof Error) return { error: error.message };
    throw error;
  }
}
